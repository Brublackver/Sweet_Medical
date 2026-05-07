/*
    SERVICE — Capa de lógica de negocio para Médicos

    SEPARACIÓN DE RESPONSABILIDADES:
    - MedicoService valida la identidad del médico (¿existe?)
    - TurnoService gestiona la lógica de los turnos
    - Los métodos de este service actúan como fachada: verifican primero
      que el médico exista, luego delegan la operación al service correcto.

    COMPOSICIÓN DE PROMESAS: el .then() inicial (obtenerPorId) es la guarda
    de identidad — si el médico no existe, la cadena se corta con NotFoundError.
*/

import { NotFoundError, BadRequestError } from "../errors/AppError.js";

export class MedicoService {
    constructor({ medicoRepository, turnoService } = {}) {
        this.medicoRepository = medicoRepository;
        this.turnoService     = turnoService;
    }

    // Guarda de identidad: reutilizada internamente por todos los métodos.
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
        return this.medicoRepository.crear(datos);
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

    // Devuelve slots libres de `duracion` minutos para una fecha dada.
    // Si se pasa `especialidad` o `practica`, valida que el médico la ofrezca
    // (se conectará completamente cuando se implemente Gestión de Servicios).
    //
    // COMPOSICIÓN: busca los turnos activos del médico en esa fecha y
    // delega el cálculo al dominio — Medico.calcularSlotsDisponibles.
    consultarSlotsDisponibles(medicoId, fecha, duracion, filtro = {}) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                if (filtro.especialidad) {
                    const tieneEspecialidad = medico.especialidades
                        .some(e => e.nombre?.toLowerCase() === filtro.especialidad.toLowerCase());
                    if (!tieneEspecialidad)
                        return Promise.reject(new BadRequestError(
                            `El médico no ofrece la especialidad "${filtro.especialidad}"`
                        ));
                }

                if (filtro.practica) {
                    const tienePractica = medico.practicas
                        .some(p => p.nombre?.toLowerCase() === filtro.practica.toLowerCase());
                    if (!tienePractica)
                        return Promise.reject(new BadRequestError(
                            `El médico no ofrece la práctica "${filtro.practica}"`
                        ));
                }

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
            .then((medico) => medico.definirDisponibilidad(body));
    }

    cambiarDisponibilidad(id, body) {
        return this.obtenerPorId(id)
            .then((medico) => {
                const cambiado = medico.cambiarDisponibilidad(body);
                if (!cambiado)
                    return Promise.reject(new BadRequestError(`No existe disponibilidad para la fecha ${body.fecha}`));
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
            });
    }

    // --- Operaciones sobre turnos -------------------------------------------

    // Cancela un turno del médico con motivo obligatorio.
    cancelarTurno(medicoId, turnoId, motivo) {
        return this.obtenerPorId(medicoId)
            .then(() => this.turnoService.cancelarTurnoPorMedico(turnoId, medicoId, motivo));
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
}
