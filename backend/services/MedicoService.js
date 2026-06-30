import { NotFoundError, BadRequestError, ConflictError } from "../errors/AppError.js";
import { hashPassword } from "../auth/password.js";

export class MedicoService {
    constructor({ medicoRepository, sedeService } = {}) {
        this.medicoRepository = medicoRepository;
        this.sedeService      = sedeService;
        this.turnoService     = null;
    }

    setTurnoService(turnoService) {
        this.turnoService = turnoService;
    }

    obtenerPorId(id) {
        return this.medicoRepository.obtenerPorId(id)
            .then((medico) => {
                if (!medico) return Promise.reject(new NotFoundError("Médico no encontrado"));
                return medico;
            });
    }

    obtenerTodos() {
        return this.medicoRepository.obtenerTodos();
    }

    crear(datos) {
        // Si no se envía contraseña, se usa el usuario como default (cuenta
        // inicial). Siempre se guarda hasheada, nunca en plano.
        return hashPassword(datos.password || datos.usuario)
            .then((hash) => this.medicoRepository.crear({ ...datos, password: hash }));
    }

    eliminar(id) {
        return this.obtenerPorId(id)
            .then(() => this.medicoRepository.eliminar(id));
    }

    // Reset de contraseña (operación de admin). Verifica que exista, hashea la
    // nueva clave y la guarda. No devuelve el hash ni la clave en plano.
    resetearPassword(id, nuevaPassword) {
        return this.obtenerPorId(id)
            .then(() => hashPassword(nuevaPassword))
            .then((hash) => this.medicoRepository.actualizarPassword(id, hash))
            .then(() => ({ id }));
    }

    // --- Disponibilidad -----------------------------------------------------

    obtenerDisponibilidad(id) {
        return this.obtenerPorId(id)
            .then((medico) =>
                this.turnoService.buscarPorMedico(id)
                    .then((turnos) => medico.obtenerDisponibilidadConTurnos(turnos))
            );
    }

    obtenerDisponibilidadPorFecha(id, fecha) {
        return this.obtenerPorId(id)
            .then((medico) =>
                this.turnoService.buscarPorMedico(id)
                    .then((turnos) => medico.obtenerDisponibilidadPorFecha(fecha, turnos))
            );
    }

    consultarSlotsDisponibles(medicoId, fecha, duracion, filtro = {}) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                if (filtro.especialidad && !medico.tieneEspecialidad(filtro.especialidad))
                    return Promise.reject(new BadRequestError(
                        `El médico no ofrece la especialidad "${filtro.especialidad}"`
                    ));

                if (filtro.practica && !medico.tienePractica(filtro.practica))
                    return Promise.reject(new BadRequestError(
                        `El médico no ofrece la práctica "${filtro.practica}"`
                    ));

                return this.turnoService
                    .buscarPorMedico(medicoId)
                    .then((turnos) => {
                        const turnosActivos = turnos.filter(t => t.fecha === fecha);
                        return {
                            fecha,
                            duracion,
                            slotsDisponibles: medico.calcularSlotsDisponibles(fecha, duracion, turnosActivos),
                        };
                    });
            });
    }

    definirDisponibilidad(id, body) {
        return this.obtenerPorId(id)
            .then((medico) => {
                medico.definirDisponibilidad(body);
                return this.medicoRepository.actualizar(medico);
            });
    }

    cambiarDisponibilidad(id, body) {
        return this.obtenerPorId(id)
            .then((medico) => {
                const cambiado = medico.cambiarDisponibilidad(body);
                if (!cambiado)
                    return Promise.reject(new BadRequestError(`No existe disponibilidad para la fecha ${body.fecha}`));
                return this.medicoRepository.actualizar(medico);
            });
    }

    obtenerDisponibilidadPorId(medicoId, disponibilidadId) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                const disp = medico.obtenerDisponibilidadPorId(disponibilidadId);
                if (!disp) return Promise.reject(new NotFoundError("Disponibilidad no encontrada"));
                return disp;
            });
    }

    eliminarDisponibilidadPorId(medicoId, disponibilidadId) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                const eliminado = medico.eliminarDisponibilidadPorId(disponibilidadId);
                if (!eliminado) return Promise.reject(new NotFoundError("Disponibilidad no encontrada"));
                return this.medicoRepository.actualizar(medico);
            });
    }

    // --- Operaciones sobre turnos -------------------------------------------

    // Cancela un turno del médico con motivo obligatorio.
    cancelarTurno(medicoId, turnoId, motivo) {
        return this.obtenerPorId(medicoId)
            .then(() => this.turnoService.cancelarTurnoPorMedico(turnoId, medicoId, motivo));
    }

    obtenerTurnosConfirmados(medicoId) {
        return this.obtenerPorId(medicoId)
            .then(() => this.turnoService.buscarPorMedico(medicoId))
            .then((turnos) => turnos.filter((t) => t.estado === "reservado"));
    }

    // Consulta el historial de turnos de un paciente específico con este médico.
    historialTurnosDePaciente(medicoId, pacienteId) {
        return this.obtenerPorId(medicoId)
            .then(() => this.turnoService.historialPorMedicoYPaciente(medicoId, pacienteId));
    }

    // Propone un cambio de fecha → el paciente deberá confirmar o rechazar.
    proponerCambioFecha(medicoId, turnoId, nuevaFecha, nuevaHora) {
        return this.obtenerPorId(medicoId)
            .then(() => this.turnoService.proponerCambioFecha(turnoId, medicoId, nuevaFecha, nuevaHora));
    }

    // Confirma la solicitud de cambio de fecha iniciada por el paciente.
    confirmarCambioPaciente(medicoId, turnoId) {
        return this.obtenerPorId(medicoId)
            .then(() => this.turnoService.confirmarCambioPaciente(turnoId, medicoId));
    }

    // Rechaza la solicitud de cambio de fecha iniciada por el paciente.
    rechazarCambioPaciente(medicoId, turnoId) {
        return this.obtenerPorId(medicoId)
            .then(() => this.turnoService.rechazarCambioPaciente(turnoId, medicoId));
    }

    // Marca un turno como realizado (el médico confirma que la consulta se realizó).
    marcarTurnoRealizado(medicoId, turnoId) {
        return this.obtenerPorId(medicoId)
            .then(() => this.turnoService.marcarRealizado(turnoId, medicoId));
    }

    // --- Gestión de sedes ------------------------------------------------------

    asignarSede(medicoId, sedeId) {
        return Promise.all([
            this.obtenerPorId(medicoId),
            this.sedeService.obtenerPorId(sedeId),
        ])
        .then(([medico, sede]) => {
            if (!sede)
                return Promise.reject(new NotFoundError("Sede no encontrada"));
            if (!medico.agregarSede(sede))
                return Promise.reject(new ConflictError("El médico ya tiene asignada esa sede"));
            return this.medicoRepository.actualizar(medico).then(() => sede);
        });
    }

    quitarSede(medicoId, sedeId) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                if (!medico.eliminarSede(sedeId))
                    return Promise.reject(new NotFoundError("El médico no tiene asignada esa sede"));
                return this.medicoRepository.actualizar(medico);
            });
    }

    // --- Gestión de servicios: Especialidades ----------------------------------

    agregarEspecialidad(medicoId, datos) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                const especialidad = medico.agregarEspecialidad(datos);
                if (!especialidad)
                    return Promise.reject(new ConflictError(
                        `Ya existe una especialidad con código "${datos.codigo.trim().toUpperCase()}"`
                    ));
                return this.medicoRepository.actualizar(medico)
                    .then((m) => m.especialidades.find(e => e.codigo === especialidad.codigo));
            });
    }

    modificarEspecialidad(medicoId, especialidadId, datos) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                const especialidad = medico.modificarEspecialidad(especialidadId, datos);
                if (!especialidad)
                    return Promise.reject(new NotFoundError("Especialidad no encontrada"));
                return this.medicoRepository.actualizar(medico).then(() => especialidad);
            });
    }

    eliminarEspecialidad(medicoId, especialidadId) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                if (!medico.eliminarEspecialidad(especialidadId))
                    return Promise.reject(new NotFoundError("Especialidad no encontrada"));
                return this.medicoRepository.actualizar(medico);
            });
    }

    // --- Gestión de servicios: Prácticas ---------------------------------------

    agregarPractica(medicoId, datos) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                const practica = medico.agregarPractica(datos);
                if (!practica)
                    return Promise.reject(new ConflictError(
                        `Ya existe una práctica con código "${datos.codigo.trim().toUpperCase()}"`
                    ));
                return this.medicoRepository.actualizar(medico)
                    .then((m) => m.practicas.find(p => p.codigo === practica.codigo));
            });
    }

    modificarPractica(medicoId, practicaId, datos) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                const practica = medico.modificarPractica(practicaId, datos);
                if (!practica)
                    return Promise.reject(new NotFoundError("Práctica no encontrada"));
                return this.medicoRepository.actualizar(medico).then(() => practica);
            });
    }

    eliminarPractica(medicoId, practicaId) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                if (!medico.eliminarPractica(practicaId))
                    return Promise.reject(new NotFoundError("Práctica no encontrada"));
                return this.medicoRepository.actualizar(medico);
            });
    }
}
