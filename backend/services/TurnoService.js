/*
    SERVICE — Capa de lógica de negocio para Turnos

    Orquesta los flujos de negocio que involucran turnos.
    Las validaciones de dominio viven en Turno y Medico.
    El acceso a datos vive en los Repositories.

    SEPARACIÓN DE RESPONSABILIDADES: este Service no decide si un turno
    "puede" hacer algo — le pregunta al turno mismo (domain logic).
    El Service solo coordina el flujo.

    COMPOSICIÓN DE PROMESAS: cada flujo es una cadena de .then()
    con una sola responsabilidad por eslabón.
*/

import { NotFoundError, ConflictError, BadRequestError } from "../errors/AppError.js";
import { ESTADOS } from "../domain/Turno.js";

export class TurnoService {
    constructor({ turnoRepository, medicoService, notificacionService } = {}) {
        this.turnoRepository     = turnoRepository;
        this.medicoService       = medicoService;
        this.notificacionService = notificacionService;
    }

    obtenerTodos() {
        return this.turnoRepository.obtenerTodos();
    }

    // Reserva un turno validando disponibilidad del médico y sin solapamiento.
    crearTurno(datos) {
        return this.medicoService
            .obtenerPorId(datos.medicoId)
            .then((medico) => {
                if (!medico.tieneDisponibilidad(datos.fecha, datos.hora, datos.duracion))
                    return Promise.reject(new BadRequestError(
                        `El médico no tiene disponibilidad el ${datos.fecha} a las ${datos.hora} por ${datos.duracion} minutos`
                    ));

                return this.turnoRepository
                    .buscarPorMedicoYFecha(datos.medicoId, datos.fecha)
                    .then((turnosDeLaFecha) => {
                        if (medico.tieneConflictoConTurnos(datos.hora, datos.duracion, turnosDeLaFecha))
                            return Promise.reject(new ConflictError(
                                "El horario solicitado se superpone con un turno ya reservado"
                            ));

                        return this.turnoRepository.crear(
                            datos.medicoId, datos.pacienteId,
                            datos.fecha, datos.hora, datos.duracion
                        );
                    });
            });
    }

    // --- Cancelación --------------------------------------------------------

    // Cancela un turno validando que pertenece al paciente.
    cancelarTurnoPorPaciente(turnoId, pacienteId, motivo) {
        return this.turnoRepository.obtenerPorId(turnoId)
            .then((turno) => {
                if (!turno)
                    return Promise.reject(new NotFoundError("Turno no encontrado"));
                if (turno.pacienteId !== pacienteId)
                    return Promise.reject(new BadRequestError("El turno no pertenece al paciente"));
                if (!turno.puedeSerCancelado())
                    return Promise.reject(new BadRequestError(
                        "No se puede cancelar: el turno ya fue cancelado, realizado, o falta menos de 1 hora"
                    ));

                turno.cancelar(motivo);
                return this.turnoRepository.actualizar(turno);
            });
    }

    // Cancela un turno validando que pertenece al médico.
    cancelarTurnoPorMedico(turnoId, medicoId, motivo) {
        return this.turnoRepository.obtenerPorId(turnoId)
            .then((turno) => {
                if (!turno)
                    return Promise.reject(new NotFoundError("Turno no encontrado"));
                if (turno.medicoId !== medicoId)
                    return Promise.reject(new BadRequestError("El turno no pertenece al médico"));
                if (!turno.puedeSerCancelado())
                    return Promise.reject(new BadRequestError(
                        "No se puede cancelar: el turno ya fue cancelado, realizado, o falta menos de 1 hora"
                    ));

                turno.cancelar(motivo);
                return this.turnoRepository.actualizar(turno);
            });
    }

    // --- Marcar como realizado ----------------------------------------------

    marcarRealizado(turnoId, medicoId) {
        return this.turnoRepository.obtenerPorId(turnoId)
            .then((turno) => {
                if (!turno)
                    return Promise.reject(new NotFoundError("Turno no encontrado"));
                if (turno.medicoId !== medicoId)
                    return Promise.reject(new BadRequestError("El turno no pertenece al médico"));
                if (!turno.puedeMarcarseRealizado())
                    return Promise.reject(new BadRequestError(
                        "No se puede marcar como realizado: estado inválido o el turno aún no ocurrió"
                    ));

                turno.marcarRealizado();
                return this.turnoRepository.actualizar(turno);
            });
    }

    // --- Cambios de fecha: flujo del PACIENTE (solicita → médico confirma) --

    solicitarCambioFecha(turnoId, pacienteId, nuevaFecha, nuevaHora) {
        return this.turnoRepository.obtenerPorId(turnoId)
            .then((turno) => {
                if (!turno)
                    return Promise.reject(new NotFoundError("Turno no encontrado"));
                if (turno.pacienteId !== pacienteId)
                    return Promise.reject(new BadRequestError("El turno no pertenece al paciente"));
                if (!turno.puedeSolicitarCambioFecha())
                    return Promise.reject(new BadRequestError(
                        "No se puede solicitar cambio de fecha: estado inválido o falta menos de 1 hora"
                    ));

                turno.solicitarCambioFecha(nuevaFecha, nuevaHora);
                return this.turnoRepository.actualizar(turno);
            });
    }

    // El médico confirma la solicitud del paciente → valida disponibilidad antes de aplicar.
    confirmarCambioPaciente(turnoId, medicoId) {
        return this.turnoRepository.obtenerPorId(turnoId)
            .then((turno) => {
                if (!turno)
                    return Promise.reject(new NotFoundError("Turno no encontrado"));
                if (turno.medicoId !== medicoId)
                    return Promise.reject(new BadRequestError("El turno no pertenece al médico"));
                if (turno.estado !== ESTADOS.PENDIENTE_CAMBIO || !turno.solicitudCambioFecha)
                    return Promise.reject(new BadRequestError("El turno no tiene una solicitud de cambio pendiente"));

                const { nuevaFecha, nuevaHora } = turno.solicitudCambioFecha;

                return this.medicoService
                    .obtenerPorId(medicoId)
                    .then((medico) => {
                        if (!medico.tieneDisponibilidad(nuevaFecha, nuevaHora, turno.duracion))
                            return Promise.reject(new BadRequestError(
                                `El médico no tiene disponibilidad para la nueva fecha ${nuevaFecha} a las ${nuevaHora}`
                            ));

                        return this.turnoRepository
                            .buscarPorMedicoYFecha(medicoId, nuevaFecha)
                            .then((turnosDeLaFecha) => {
                                const otros = turnosDeLaFecha.filter(t => t.id !== turnoId);
                                if (medico.tieneConflictoConTurnos(nuevaHora, turno.duracion, otros))
                                    return Promise.reject(new ConflictError(
                                        "La nueva fecha/hora se superpone con otro turno reservado"
                                    ));

                                turno.confirmarCambioSolicitado();
                                return this.turnoRepository.actualizar(turno);
                            });
                    });
            });
    }

    // El médico rechaza la solicitud del paciente → turno vuelve a RESERVADO con fecha original.
    rechazarCambioPaciente(turnoId, medicoId) {
        return this.turnoRepository.obtenerPorId(turnoId)
            .then((turno) => {
                if (!turno)
                    return Promise.reject(new NotFoundError("Turno no encontrado"));
                if (turno.medicoId !== medicoId)
                    return Promise.reject(new BadRequestError("El turno no pertenece al médico"));
                if (turno.estado !== ESTADOS.PENDIENTE_CAMBIO || !turno.solicitudCambioFecha)
                    return Promise.reject(new BadRequestError("El turno no tiene una solicitud de cambio pendiente"));

                turno.rechazarCambioSolicitado();
                return this.turnoRepository.actualizar(turno);
            });
    }

    // --- Cambios de fecha: flujo del MÉDICO (propone → paciente confirma) ---

    proponerCambioFecha(turnoId, medicoId, nuevaFecha, nuevaHora) {
        return this.turnoRepository.obtenerPorId(turnoId)
            .then((turno) => {
                if (!turno)
                    return Promise.reject(new NotFoundError("Turno no encontrado"));
                if (turno.medicoId !== medicoId)
                    return Promise.reject(new BadRequestError("El turno no pertenece al médico"));
                if (!turno.puedeProponerCambioFecha())
                    return Promise.reject(new BadRequestError(
                        "No se puede proponer cambio: estado inválido o falta menos de 1 hora"
                    ));

                turno.proponerCambioFecha(nuevaFecha, nuevaHora);

                return this.turnoRepository.actualizar(turno)
                    .then((turnoActualizado) => {
                        if (this.notificacionService)
                            return this.notificacionService.crear(
                                turno.pacienteId,
                                "PROPUESTA_CAMBIO_FECHA",
                                `El médico propuso cambiar tu turno del ${turno.fecha} ${turno.hora} al ${nuevaFecha} ${nuevaHora}`
                            ).then(() => turnoActualizado);
                        return turnoActualizado;
                    });
            });
    }

    // El paciente confirma la propuesta del médico → valida disponibilidad antes de aplicar.
    confirmarPropuestaMedico(turnoId, pacienteId) {
        return this.turnoRepository.obtenerPorId(turnoId)
            .then((turno) => {
                if (!turno)
                    return Promise.reject(new NotFoundError("Turno no encontrado"));
                if (turno.pacienteId !== pacienteId)
                    return Promise.reject(new BadRequestError("El turno no pertenece al paciente"));
                if (turno.estado !== ESTADOS.PROPUESTA_MEDICO || !turno.propuestaMedicoFecha)
                    return Promise.reject(new BadRequestError("El turno no tiene una propuesta del médico pendiente"));

                const { nuevaFecha, nuevaHora } = turno.propuestaMedicoFecha;

                return this.medicoService
                    .obtenerPorId(turno.medicoId)
                    .then((medico) => {
                        if (!medico.tieneDisponibilidad(nuevaFecha, nuevaHora, turno.duracion))
                            return Promise.reject(new BadRequestError(
                                `El médico no tiene disponibilidad para la nueva fecha ${nuevaFecha} a las ${nuevaHora}`
                            ));

                        return this.turnoRepository
                            .buscarPorMedicoYFecha(turno.medicoId, nuevaFecha)
                            .then((turnosDeLaFecha) => {
                                const otros = turnosDeLaFecha.filter(t => t.id !== turnoId);
                                if (medico.tieneConflictoConTurnos(nuevaHora, turno.duracion, otros))
                                    return Promise.reject(new ConflictError(
                                        "La nueva fecha/hora se superpone con otro turno reservado"
                                    ));

                                turno.confirmarPropuestaMedico();
                                return this.turnoRepository.actualizar(turno);
                            });
                    });
            });
    }

    // El paciente rechaza la propuesta del médico → turno vuelve a RESERVADO con fecha original.
    rechazarPropuestaMedico(turnoId, pacienteId) {
        return this.turnoRepository.obtenerPorId(turnoId)
            .then((turno) => {
                if (!turno)
                    return Promise.reject(new NotFoundError("Turno no encontrado"));
                if (turno.pacienteId !== pacienteId)
                    return Promise.reject(new BadRequestError("El turno no pertenece al paciente"));
                if (turno.estado !== ESTADOS.PROPUESTA_MEDICO || !turno.propuestaMedicoFecha)
                    return Promise.reject(new BadRequestError("El turno no tiene una propuesta del médico pendiente"));

                turno.rechazarPropuestaMedico();
                return this.turnoRepository.actualizar(turno);
            });
    }

    // --- Historial y búsquedas ----------------------------------------------

    historialPorPaciente(pacienteId) {
        return this.turnoRepository.buscarPorPaciente(pacienteId);
    }

    historialPorMedicoYPaciente(medicoId, pacienteId) {
        return this.turnoRepository.buscarPorMedicoYPaciente(medicoId, pacienteId);
    }

    buscarPorMedico(medicoId) {
        return this.turnoRepository.buscarPorMedico(medicoId);
    }
}
