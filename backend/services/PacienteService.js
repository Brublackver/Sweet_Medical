import { NotFoundError, ConflictError } from "../errors/AppError.js";

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
                return this.pacienteRepository.crear(datos);
            });
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

    // Retorna todos los turnos del paciente (todos los estados).
    // Permite consultar el historial completo: reservados, cancelados, realizados.
    historialTurnos(pacienteId) {
        return this.obtenerPorId(pacienteId)
            .then(() => this.turnoService.historialPorPaciente(pacienteId));
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
}
