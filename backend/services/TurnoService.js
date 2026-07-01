import { NotFoundError, ConflictError, BadRequestError } from "../errors/AppError.js";
import { ESTADOS, ESTADOS_ACTIVOS } from "../domain/Turno.js";
import { USUARIO_TIPOS, TIPOS_NOTIFICACION, RESULTADOS } from "../domain/Notificacion.js";
import { fechaHoyISO, isAppointmentBookable } from "../domain/tiempo.js";

export class TurnoService {
    constructor({ turnoRepository, medicoService, pacienteRepository, notificacionService } = {}) {
        this.turnoRepository     = turnoRepository;
        this.medicoService       = medicoService;
        this.pacienteRepository  = pacienteRepository;
        this.notificacionService = notificacionService;
    }

    obtenerTodos() {
        return this.turnoRepository.obtenerTodos();
    }

    // Emite una notificación si hay servicio inyectado. No-op en tests / contextos
    // sin notificaciones. Devuelve `valor` para encadenar sin romper el flujo.
    _notificar(usuarioTipo, usuarioId, tipo, mensaje, turnoId, valor) {
        if (!this.notificacionService) return Promise.resolve(valor);
        return this.notificacionService
            .crear(usuarioTipo, usuarioId, tipo, mensaje, turnoId)
            .then(() => valor);
    }

    // Deja registrado cómo se resolvió la notificación accionable que el usuario
    // tenía pendiente para este turno (ACEPTADO / RECHAZADO). Se invoca al confirmar
    // o rechazar un cambio, así la decisión queda persistida sin importar desde
    // dónde se haya respondido. No-op si no hay servicio de notificaciones inyectado.
    _resolverNotificacion(usuarioTipo, usuarioId, turnoId, tipo, resultado, valor) {
        if (!this.notificacionService) return Promise.resolve(valor);
        return this.notificacionService
            .resolverPorTurno(usuarioTipo, usuarioId, turnoId, tipo, resultado)
            .then(() => valor);
    }

    // Reserva un turno validando disponibilidad del médico y sin solapamiento.
    // Captura un snapshot del médico y del paciente para preservar su estado actual.
    crearTurno(datos) {
        return Promise.all([
            this.medicoService.obtenerPorId(datos.medicoId),
            this.pacienteRepository.obtenerPorId(datos.pacienteId),
        ]).then(([medico, paciente]) => {
            if (!medico)
                return Promise.reject(new NotFoundError("Médico no encontrado"));
            if (!paciente)
                return Promise.reject(new NotFoundError("Paciente no encontrado"));

            // El turno debe ser estrictamente futuro. La fecha/hora se interpreta en
            // hora de Argentina (ver buildAppointmentDateTime) para no rechazar turnos
            // válidos por la zona horaria del servidor.
            if (!isAppointmentBookable(datos.fecha, datos.hora))
                return Promise.reject(new BadRequestError(
                    "El turno ya no está disponible porque su horario venció."
                ));

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

                    const snapshotMedico = {
                        medicoId:       medico.id,
                        nombre:         medico.nombre,
                        matricula:      medico.matricula,
                        especialidades: medico.especialidades.map((e) => ({
                            codigo: e.codigo, nombre: e.nombre,
                            duracionTurnoEnMins: e.duracionTurnoEnMins, costo: e.costo,
                        })),
                        practicas: medico.practicas.map((p) => ({
                            codigo: p.codigo, nombre: p.nombre,
                            duracionTurnoEnMins: p.duracionTurnoEnMins, costo: p.costo,
                        })),
                    };

                    const planPaciente = paciente.plan;
                    const snapshotPaciente = {
                        pacienteId: paciente.pacienteId,
                        nombre:     paciente.nombre,
                        dni:        paciente.dni,
                        obraSocial: paciente.obraSocial,
                        plan: planPaciente ? {
                            nombre:           planPaciente.nombre,
                            coberturaGeneral: planPaciente.coberturaGeneral,
                        } : null,
                    };

                    return this.turnoRepository.crear(
                        datos.medicoId, datos.pacienteId,
                        datos.fecha, datos.hora, datos.duracion,
                        snapshotMedico, snapshotPaciente
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
                return this.turnoRepository.actualizar(turno).then((actualizado) =>
                    // El paciente canceló → se notifica al médico.
                    this._notificar(
                        USUARIO_TIPOS.MEDICO, turno.medicoId,
                        TIPOS_NOTIFICACION.TURNO_CANCELADO,
                        `El paciente canceló el turno del ${turno.fecha} ${turno.hora}. Motivo: ${motivo}`,
                        turno.id, actualizado
                    )
                );
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
                return this.turnoRepository.actualizar(turno).then((actualizado) =>
                    // El médico canceló → se notifica al paciente.
                    this._notificar(
                        USUARIO_TIPOS.PACIENTE, turno.pacienteId,
                        TIPOS_NOTIFICACION.TURNO_CANCELADO,
                        `El médico canceló tu turno del ${turno.fecha} ${turno.hora}. Motivo: ${motivo}`,
                        turno.id, actualizado
                    )
                );
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

                // Validar disponibilidad y solapamiento antes de persistir la solicitud:
                // no tiene sentido enviarle al médico una petición que no puede confirmar.
                return this.medicoService
                    .obtenerPorId(turno.medicoId)
                    .then((medico) => {
                        if (!medico.tieneDisponibilidad(nuevaFecha, nuevaHora, turno.duracion))
                            return Promise.reject(new BadRequestError(
                                `El médico no tiene disponibilidad el ${nuevaFecha} a las ${nuevaHora}`
                            ));

                        return this.turnoRepository
                            .buscarPorMedicoYFecha(turno.medicoId, nuevaFecha)
                            .then((turnosDeLaFecha) => {
                                const otros = turnosDeLaFecha.filter(t => t.id !== turnoId);
                                if (medico.tieneConflictoConTurnos(nuevaHora, turno.duracion, otros))
                                    return Promise.reject(new ConflictError(
                                        "El horario solicitado se superpone con otro turno reservado"
                                    ));

                                const fechaOriginal = `${turno.fecha} ${turno.hora}`;
                                turno.solicitarCambioFecha(nuevaFecha, nuevaHora);
                                return this.turnoRepository.actualizar(turno).then((actualizado) =>
                                    this._notificar(
                                        USUARIO_TIPOS.MEDICO, turno.medicoId,
                                        TIPOS_NOTIFICACION.SOLICITUD_CAMBIO_FECHA,
                                        `El paciente solicitó cambiar su turno del ${fechaOriginal} al ${nuevaFecha} ${nuevaHora}`,
                                        turno.id, actualizado
                                    )
                                );
                            });
                    });
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
                                return this.turnoRepository.actualizar(turno).then((actualizado) =>
                                    // Queda registrado que el médico ACEPTÓ la solicitud que tenía pendiente...
                                    this._resolverNotificacion(
                                        USUARIO_TIPOS.MEDICO, turno.medicoId, turno.id,
                                        TIPOS_NOTIFICACION.SOLICITUD_CAMBIO_FECHA, RESULTADOS.ACEPTADO, actualizado
                                    ).then((valor) =>
                                        // ...y se le avisa al paciente.
                                        this._notificar(
                                            USUARIO_TIPOS.PACIENTE, turno.pacienteId,
                                            TIPOS_NOTIFICACION.CAMBIO_CONFIRMADO,
                                            `El médico confirmó tu cambio: tu turno quedó para el ${turno.fecha} ${turno.hora}`,
                                            turno.id, valor
                                        )
                                    )
                                );
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
                return this.turnoRepository.actualizar(turno).then((actualizado) =>
                    // Queda registrado que el médico RECHAZÓ la solicitud que tenía pendiente...
                    this._resolverNotificacion(
                        USUARIO_TIPOS.MEDICO, turno.medicoId, turno.id,
                        TIPOS_NOTIFICACION.SOLICITUD_CAMBIO_FECHA, RESULTADOS.RECHAZADO, actualizado
                    ).then((valor) =>
                        // ...y se le avisa al paciente.
                        this._notificar(
                            USUARIO_TIPOS.PACIENTE, turno.pacienteId,
                            TIPOS_NOTIFICACION.CAMBIO_RECHAZADO,
                            `El médico rechazó tu solicitud de cambio: tu turno sigue el ${turno.fecha} ${turno.hora}`,
                            turno.id, valor
                        )
                    )
                );
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

                // Validar disponibilidad y solapamiento antes de persistir la propuesta:
                // si el médico propone un horario que no puede cumplir, el paciente no podría confirmarlo.
                return this.medicoService
                    .obtenerPorId(medicoId)
                    .then((medico) => {
                        if (!medico.tieneDisponibilidad(nuevaFecha, nuevaHora, turno.duracion))
                            return Promise.reject(new BadRequestError(
                                `No tenés disponibilidad el ${nuevaFecha} a las ${nuevaHora}`
                            ));

                        return this.turnoRepository
                            .buscarPorMedicoYFecha(medicoId, nuevaFecha)
                            .then((turnosDeLaFecha) => {
                                const otros = turnosDeLaFecha.filter(t => t.id !== turnoId);
                                if (medico.tieneConflictoConTurnos(nuevaHora, turno.duracion, otros))
                                    return Promise.reject(new ConflictError(
                                        "El horario propuesto se superpone con otro turno reservado"
                                    ));

                                const fechaOriginal = `${turno.fecha} ${turno.hora}`;
                                turno.proponerCambioFecha(nuevaFecha, nuevaHora);
                                return this.turnoRepository.actualizar(turno).then((actualizado) =>
                                    this._notificar(
                                        USUARIO_TIPOS.PACIENTE, turno.pacienteId,
                                        TIPOS_NOTIFICACION.PROPUESTA_CAMBIO_FECHA,
                                        `El médico propuso cambiar tu turno del ${fechaOriginal} al ${nuevaFecha} ${nuevaHora}`,
                                        turno.id, actualizado
                                    )
                                );
                            });
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
                                return this.turnoRepository.actualizar(turno).then((actualizado) =>
                                    // Queda registrado que el paciente ACEPTÓ la propuesta que tenía pendiente...
                                    this._resolverNotificacion(
                                        USUARIO_TIPOS.PACIENTE, turno.pacienteId, turno.id,
                                        TIPOS_NOTIFICACION.PROPUESTA_CAMBIO_FECHA, RESULTADOS.ACEPTADO, actualizado
                                    ).then((valor) =>
                                        // ...y se le avisa al médico.
                                        this._notificar(
                                            USUARIO_TIPOS.MEDICO, turno.medicoId,
                                            TIPOS_NOTIFICACION.CAMBIO_CONFIRMADO,
                                            `El paciente aceptó tu propuesta: el turno quedó para el ${turno.fecha} ${turno.hora}`,
                                            turno.id, valor
                                        )
                                    )
                                );
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
                return this.turnoRepository.actualizar(turno).then((actualizado) =>
                    // Queda registrado que el paciente RECHAZÓ la propuesta que tenía pendiente...
                    this._resolverNotificacion(
                        USUARIO_TIPOS.PACIENTE, turno.pacienteId, turno.id,
                        TIPOS_NOTIFICACION.PROPUESTA_CAMBIO_FECHA, RESULTADOS.RECHAZADO, actualizado
                    ).then((valor) =>
                        // ...y se le avisa al médico.
                        this._notificar(
                            USUARIO_TIPOS.MEDICO, turno.medicoId,
                            TIPOS_NOTIFICACION.CAMBIO_RECHAZADO,
                            `El paciente rechazó tu propuesta: el turno sigue el ${turno.fecha} ${turno.hora}`,
                            turno.id, valor
                        )
                    )
                );
            });
    }

    // --- Próximos turnos ----------------------------------------------------

    // Ordena ascendente por fecha y luego por hora. Las fechas y horas son
    // strings ISO ("YYYY-MM-DD" / "HH:MM"), por lo que el orden lexicográfico
    // coincide con el cronológico — no hace falta parsear a Date.
    _ordenarPorFechaHora(turnos) {
        return [...turnos].sort((a, b) =>
            a.fecha === b.fecha ? a.hora.localeCompare(b.hora) : a.fecha.localeCompare(b.fecha)
        );
    }

    // Sólo turnos activos (no cancelados/realizados) de hoy en adelante,
    // ya ordenados ascendentemente. El procesamiento vive en el servidor:
    // el cliente recibe la lista lista para mostrar.
    _filtrarProximos(turnos, hoy) {
        return this._ordenarPorFechaHora(
            turnos.filter((t) => ESTADOS_ACTIVOS.includes(t.estado) && t.fecha >= hoy)
        );
    }

    proximosTurnosPorPaciente(pacienteId, hoy = fechaHoyISO()) {
        return this.turnoRepository.buscarPorPaciente(pacienteId)
            .then((turnos) => this._filtrarProximos(turnos, hoy));
    }

    proximosTurnosPorMedico(medicoId, hoy = fechaHoyISO()) {
        return this.turnoRepository.buscarPorMedico(medicoId)
            .then((turnos) => this._filtrarProximos(turnos, hoy));
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

    buscarPorMedicoYFecha(medicoId, fecha) {
        return this.turnoRepository.buscarPorMedicoYFecha(medicoId, fecha);
    }
}
