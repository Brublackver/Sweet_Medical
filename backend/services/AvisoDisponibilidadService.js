import { NotFoundError, ForbiddenError, ConflictError } from "../errors/AppError.js";
import { AvisoDisponibilidad, ESTADOS_AVISO } from "../domain/AvisoDisponibilidad.js";
import { USUARIO_TIPOS, TIPOS_NOTIFICACION }   from "../domain/Notificacion.js";

/*
    SERVICE — Fila de espera / avisos de disponibilidad

    Dos responsabilidades bien separadas:

    1. ALTA Y BAJA de avisos (lo que hace el paciente).
    2. EVALUACIÓN: cuando aparece disponibilidad para un médico en una fecha,
       decidir a qué pacientes en espera hay que notificar.

    La evaluación NO reimplementa el matching de filtros: delega en BusquedaService,
    el MISMO servicio que responde GET /turno/buscar. Si la búsqueda del paciente
    ahora devuelve algo, entonces hay turno para él. Punto. Reusar la búsqueda real
    garantiza que el aviso nunca prometa un turno que la pantalla no muestre.

    BusquedaService se inyecta por setter (no por constructor) para no crear un
    ciclo de imports: BusquedaService ya depende de médicos, turnos y pacientes.
*/
export class AvisoDisponibilidadService {
    constructor({ avisoDisponibilidadRepository, notificacionService, busquedaService } = {}) {
        this.avisoDisponibilidadRepository = avisoDisponibilidadRepository;
        this.notificacionService           = notificacionService;
        this.busquedaService               = busquedaService ?? null;
    }

    setBusquedaService(busquedaService) {
        this.busquedaService = busquedaService;
    }

    // --- Alta / baja / consulta (paciente) ----------------------------------

    // Crea el aviso. Si el paciente ya tiene uno ACTIVO con los mismos filtros,
    // NO se duplica: se devuelve el que ya existía. Pedir dos veces lo mismo no
    // es un error del usuario, así que no se le tira un 409 en la cara.
    crear(pacienteId, filtros) {
        const normalizados = AvisoDisponibilidad.normalizarFiltros(filtros);
        const huella       = AvisoDisponibilidad.calcularHuella(normalizados);

        return this.avisoDisponibilidadRepository
            .buscarActivoPorHuella(pacienteId, huella)
            .then((existente) => {
                if (existente) return existente;
                return this.avisoDisponibilidadRepository.crear(pacienteId, normalizados);
            });
    }

    obtenerPorPaciente(pacienteId, estado) {
        return this.avisoDisponibilidadRepository.obtenerPorPaciente(pacienteId, estado);
    }

    // Da de baja el aviso validando que sea del paciente que lo reclama.
    cancelar(pacienteId, avisoId) {
        return this.avisoDisponibilidadRepository.obtenerPorId(avisoId)
            .then((aviso) => {
                if (!aviso)
                    return Promise.reject(new NotFoundError("Aviso de disponibilidad no encontrado"));
                if (aviso.pacienteId !== pacienteId)
                    return Promise.reject(new ForbiddenError("El aviso no pertenece al paciente"));
                if (aviso.estado === ESTADOS_AVISO.CANCELADO)
                    return Promise.reject(new ConflictError("El aviso ya estaba cancelado"));

                aviso.cancelar();
                return this.avisoDisponibilidadRepository.actualizar(aviso);
            });
    }

    // --- Evaluación (la dispara el sistema) ---------------------------------

    /*
        Punto de entrada único de la fila de espera. Se invoca cada vez que puede
        haber aparecido un hueco en la agenda de un médico:
          · el médico definió disponibilidad nueva;
          · un paciente canceló su turno;
          · el médico canceló un turno.

        Es "best effort" y NO debe romper la operación que la disparó: si algo
        falla acá, la cancelación del turno ya ocurrió igual. Por eso quien la
        llama lo hace en modo fire-and-forget.

        Devuelve los avisos que efectivamente se notificaron.
    */
    evaluarPorMedicoYFecha(medicoId, fecha) {
        if (!this.busquedaService) return Promise.resolve([]);

        return this.avisoDisponibilidadRepository.obtenerActivos()
            .then((avisos) => {
                // Prefiltro barato en memoria: descarta los avisos que ni siquiera
                // apuntan a este médico o a esta fecha, para no lanzar una búsqueda
                // completa por cada paciente en espera.
                const candidatos = avisos.filter(
                    (aviso) => aviso.aplicaAlMedico(medicoId) && aviso.cubreFecha(fecha)
                );

                return candidatos.reduce(
                    (cadena, aviso) => cadena.then((notificados) =>
                        this._notificarSiHayTurno(aviso, fecha)
                            .then((notificado) => (notificado ? [...notificados, aviso] : notificados))
                    ),
                    Promise.resolve([])
                );
            });
    }

    // Corre la búsqueda REAL del paciente acotada a esa fecha. Si devuelve al
    // menos un turno, hay algo para ofrecerle: se notifica y el aviso se cierra.
    _notificarSiHayTurno(aviso, fecha) {
        return this.busquedaService
            .buscar({
                pacienteId:   aviso.pacienteId,
                medicoId:     aviso.filtros.medicoId,
                especialidad: aviso.filtros.especialidad,
                practica:     aviso.filtros.practica,
                sede:         aviso.filtros.sede,
                fechaDesde:   fecha,
                fechaHasta:   fecha,
                direccion:    "asc",
            })
            .then((dias) => {
                const hayTurno = dias.some((dia) => dia.turnos.length > 0);
                if (!hayTurno) return false;

                aviso.marcarNotificado();
                return this.avisoDisponibilidadRepository.actualizar(aviso)
                    .then(() => this._notificar(aviso, fecha))
                    .then(() => true);
            })
            // Un aviso que falla no puede frenar a los demás ni a la operación
            // que disparó la evaluación.
            .catch(() => false);
    }

    _notificar(aviso, fecha) {
        if (!this.notificacionService) return Promise.resolve(null);
        return this.notificacionService.crear(
            USUARIO_TIPOS.PACIENTE,
            aviso.pacienteId,
            TIPOS_NOTIFICACION.TURNO_DISPONIBLE,
            `Se liberó un turno para el ${fecha} que coincide con tu búsqueda (${aviso.describir()}). Entrá a buscar turno para reservarlo.`,
            null
        );
    }
}
