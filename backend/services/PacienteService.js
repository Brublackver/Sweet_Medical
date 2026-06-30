import { NotFoundError, ConflictError } from "../errors/AppError.js";
import { hashPassword } from "../auth/password.js";

export class PacienteService {
    constructor({ pacienteRepository, turnoService } = {}) {
        this.pacienteRepository = pacienteRepository;
        this.turnoService       = turnoService;
    }

    // Guarda de identidad: verifica que el paciente exista antes de operar.
    // Reutilizada internamente por todos los métodos de turno.
    obtenerPorId(id) {
        return this.pacienteRepository.obtenerPorId(id)
            .then((paciente) => {
                if (!paciente) return Promise.reject(new NotFoundError("Paciente no encontrado"));
                return paciente;
            });
    }

    obtenerTodos() {
        return this.pacienteRepository.obtenerTodos();
    }

    // Crea un paciente validando que el DNI no esté registrado.
    // UNICIDAD: el DNI identifica unívocamente a una persona — no puede repetirse.
    crear(datos) {
        return this.pacienteRepository.existeDni(datos.dni)
            .then((existe) => {
                if (existe) return Promise.reject(new ConflictError(
                    `Ya existe un paciente registrado con DNI ${datos.dni}`
                ));
                // Si no se envía contraseña, se usa el usuario como default
                // (cuenta inicial). Siempre se guarda hasheada, nunca en plano.
                return hashPassword(datos.password || datos.usuario)
                    .then((hash) => this.pacienteRepository.crear({ ...datos, password: hash }));
            });
    }

    eliminar(id) {
        return this.obtenerPorId(id)
            .then(() => this.pacienteRepository.eliminar(id));
    }

    // Reset de contraseña (operación de admin). Verifica que exista, hashea la
    // nueva clave y la guarda. No devuelve el hash ni la clave en plano.
    resetearPassword(id, nuevaPassword) {
        return this.obtenerPorId(id)
            .then(() => hashPassword(nuevaPassword))
            .then((hash) => this.pacienteRepository.actualizarPassword(id, hash))
            .then(() => ({ id }));
    }

    // Reserva un turno para el paciente identificado por pacienteId.
    // El pacienteId viene del route param — no del body — para evitar
    // que alguien reserve un turno en nombre de otro paciente.
    reservarTurno(pacienteId, datosTurno) {
        return this.obtenerPorId(pacienteId)
            .then(() => this.turnoService.crearTurno({ ...datosTurno, pacienteId }));
    }

    // Cancela un turno del paciente con motivo obligatorio.
    // La validación de anticipación mínima (1 hora) vive en TurnoService.
    cancelarTurno(pacienteId, turnoId, motivo) {
        return this.obtenerPorId(pacienteId)
            .then(() => this.turnoService.cancelarTurnoPorPaciente(turnoId, pacienteId, motivo));
    }

    // Retorna los turnos del paciente.
    //   proximos = true  → sólo turnos activos de hoy en adelante, ordenados ascendente
    //                      (el servidor entrega la lista lista para mostrar).
    //   proximos = false → historial completo (reservados, cancelados, realizados).
    // El rango fechaDesde/fechaHasta se aplica en ambos casos.
    historialTurnos(pacienteId, { fechaDesde, fechaHasta, proximos = false } = {}) {
        return this.obtenerPorId(pacienteId)
            .then(() => proximos
                ? this.turnoService.proximosTurnosPorPaciente(pacienteId)
                : this.turnoService.historialPorPaciente(pacienteId)
            )
            .then((turnos) => {
                if (!fechaDesde && !fechaHasta) return turnos;
                return turnos.filter((t) => {
                    if (fechaDesde && t.fecha < fechaDesde) return false;
                    if (fechaHasta && t.fecha > fechaHasta) return false;
                    return true;
                });
            });
    }

    // Solicita un cambio de fecha para un turno del paciente.
    // El médico deberá confirmar o rechazar la solicitud.
    solicitarCambioFecha(pacienteId, turnoId, nuevaFecha, nuevaHora) {
        return this.obtenerPorId(pacienteId)
            .then(() => this.turnoService.solicitarCambioFecha(turnoId, pacienteId, nuevaFecha, nuevaHora));
    }

    // El paciente confirma la propuesta de cambio de fecha del médico.
    confirmarPropuestaMedico(pacienteId, turnoId) {
        return this.obtenerPorId(pacienteId)
            .then(() => this.turnoService.confirmarPropuestaMedico(turnoId, pacienteId));
    }

    // El paciente rechaza la propuesta del médico → turno vuelve a fecha original.
    rechazarPropuestaMedico(pacienteId, turnoId) {
        return this.obtenerPorId(pacienteId)
            .then(() => this.turnoService.rechazarPropuestaMedico(turnoId, pacienteId));
    }

    // --- Gestión de coberturas del plan ---

    agregarCoberturaEspecialidad(pacienteId, datos) {
        return this.obtenerPorId(pacienteId)
            .then((paciente) => {
                const coberturas = paciente.plan?.coberturasEspecialidad || [];
                if (coberturas.some((c) => c.especialidad?.codigo === datos.codigo))
                    return Promise.reject(new ConflictError(`Ya existe cobertura para la especialidad "${datos.codigo}"`));
                return this.pacienteRepository.agregarCoberturaEspecialidad(pacienteId, {
                    especialidad: { codigo: datos.codigo },
                    nivel: datos.nivel,
                });
            });
    }

    quitarCoberturaEspecialidad(pacienteId, codigo) {
        return this.obtenerPorId(pacienteId)
            .then(() => this.pacienteRepository.quitarCoberturaEspecialidad(pacienteId, codigo));
    }

    agregarCoberturaPractica(pacienteId, datos) {
        return this.obtenerPorId(pacienteId)
            .then((paciente) => {
                const coberturas = paciente.plan?.coberturasPractica || [];
                if (coberturas.some((c) => c.practica?.codigo === datos.codigo))
                    return Promise.reject(new ConflictError(`Ya existe cobertura para la práctica "${datos.codigo}"`));
                return this.pacienteRepository.agregarCoberturaPractica(pacienteId, {
                    practica: { codigo: datos.codigo },
                    nivel: datos.nivel,
                });
            });
    }

    quitarCoberturaPractica(pacienteId, codigo) {
        return this.obtenerPorId(pacienteId)
            .then(() => this.pacienteRepository.quitarCoberturaPractica(pacienteId, codigo));
    }
}
