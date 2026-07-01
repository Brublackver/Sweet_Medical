export const ESTADOS = Object.freeze({
    RESERVADO:        "reservado",
    CANCELADO:        "cancelado",
    PENDIENTE_CAMBIO: "pendiente_cambio",   // paciente solicitó cambio → espera médico
    PROPUESTA_MEDICO: "propuesta_medico",   // médico propuso cambio → espera paciente
    REALIZADO:        "realizado",
});

// Estados en los que un turno sigue "vivo": ni cancelado ni realizado.
// Son los que cuentan como turnos pendientes/próximos del usuario.
export const ESTADOS_ACTIVOS = Object.freeze([
    ESTADOS.RESERVADO,
    ESTADOS.PENDIENTE_CAMBIO,
    ESTADOS.PROPUESTA_MEDICO,
]);

import { horaAMinutos, buildAppointmentDateTime, isAppointmentExpired } from "./tiempo.js";

export class Turno {
    constructor(id, medicoId, pacienteId, fecha, hora, duracion, snapshotMedico = null, snapshotPaciente = null) {
        this.id         = id;
        this.medicoId   = medicoId;
        this.pacienteId = pacienteId;
        this.fecha      = fecha;
        this.hora       = hora;
        this.duracion   = duracion;
        this.estado     = ESTADOS.RESERVADO;
        this.fechaCreacion = new Date().toISOString();
        this.snapshotMedico   = snapshotMedico;
        this.snapshotPaciente = snapshotPaciente;

        // Auditoría: registro inmutable de cada transición de estado.
        this.historialEstados = [{
            fechaHora: this.fechaCreacion,
            estado:    ESTADOS.RESERVADO,
            motivo:    null,
        }];

        // Propuestas de cambio pendientes de confirmación (una por tipo de actor)
        this.solicitudCambioFecha = null;  // iniciada por el paciente
        this.propuestaMedicoFecha = null;  // iniciada por el médico
    }

    // --- Cancelación --------------------------------------------------------

    puedeCancelarse() {
        const fechaTurno = buildAppointmentDateTime(this.fecha, this.hora);
        return (fechaTurno - new Date()) / (1000 * 60 * 60) >= 1;
    }

    puedeSerCancelado() {
        return ESTADOS_ACTIVOS.includes(this.estado) && this.puedeCancelarse();
    }

    cancelar(motivo) {
        this.estado = ESTADOS.CANCELADO;
        this.historialEstados.push({
            fechaHora: new Date().toISOString(),
            estado:    ESTADOS.CANCELADO,
            motivo,
        });
    }

    // --- Marcar como realizado ----------------------------------------------

    // El turno puede marcarse como realizado si está en un estado activo
    // y su fecha y hora ya pasaron (el turno ocurrió).
    puedeMarcarseRealizado() {
        if (!ESTADOS_ACTIVOS.includes(this.estado)) return false;
        return isAppointmentExpired(this.fecha, this.hora);
    }

    marcarRealizado() {
        this.estado = ESTADOS.REALIZADO;
        this.historialEstados.push({
            fechaHora: new Date().toISOString(),
            estado:    ESTADOS.REALIZADO,
            motivo:    null,
        });
    }

    // --- Solicitud de cambio de fecha (iniciada por el PACIENTE) -----------

    puedeSolicitarCambioFecha() {
        return this.estado === ESTADOS.RESERVADO && this.puedeCancelarse();
    }

    // Transición a PENDIENTE_CAMBIO. El médico deberá confirmar o rechazar.
    solicitarCambioFecha(nuevaFecha, nuevaHora) {
        this.solicitudCambioFecha = {
            nuevaFecha,
            nuevaHora,
            estado:       "pendiente",
            solicitadoEn: new Date().toISOString(),
        };
        this.estado = ESTADOS.PENDIENTE_CAMBIO;
        this.historialEstados.push({
            fechaHora: new Date().toISOString(),
            estado:    ESTADOS.PENDIENTE_CAMBIO,
            motivo:    `Paciente solicitó cambio a ${nuevaFecha} ${nuevaHora}`,
        });
    }

    // El médico confirma la solicitud del paciente → nueva fecha aplicada, vuelve a RESERVADO.
    confirmarCambioSolicitado() {
        this.fecha  = this.solicitudCambioFecha.nuevaFecha;
        this.hora   = this.solicitudCambioFecha.nuevaHora;
        this.solicitudCambioFecha = null;
        this.estado = ESTADOS.RESERVADO;
        this.historialEstados.push({
            fechaHora: new Date().toISOString(),
            estado:    ESTADOS.RESERVADO,
            motivo:    "Cambio de fecha confirmado por el médico",
        });
    }

    // El médico rechaza la solicitud → fecha original, vuelve a RESERVADO.
    rechazarCambioSolicitado() {
        this.solicitudCambioFecha = null;
        this.estado = ESTADOS.RESERVADO;
        this.historialEstados.push({
            fechaHora: new Date().toISOString(),
            estado:    ESTADOS.RESERVADO,
            motivo:    "Cambio de fecha rechazado por el médico",
        });
    }

    // --- Propuesta de cambio de fecha (iniciada por el MÉDICO) -------------

    puedeProponerCambioFecha() {
        return [ESTADOS.RESERVADO, ESTADOS.PENDIENTE_CAMBIO].includes(this.estado)
            && this.puedeCancelarse();
    }

    // Transición a PROPUESTA_MEDICO. El paciente deberá confirmar o rechazar.
    proponerCambioFecha(nuevaFecha, nuevaHora) {
        this.propuestaMedicoFecha = {
            nuevaFecha,
            nuevaHora,
            estado:      "pendiente",
            propuestoEn: new Date().toISOString(),
        };
        this.estado = ESTADOS.PROPUESTA_MEDICO;
        this.historialEstados.push({
            fechaHora: new Date().toISOString(),
            estado:    ESTADOS.PROPUESTA_MEDICO,
            motivo:    `Médico propuso cambio a ${nuevaFecha} ${nuevaHora}`,
        });
    }

    // El paciente confirma la propuesta del médico → nueva fecha aplicada, vuelve a RESERVADO.
    confirmarPropuestaMedico() {
        this.fecha  = this.propuestaMedicoFecha.nuevaFecha;
        this.hora   = this.propuestaMedicoFecha.nuevaHora;
        this.propuestaMedicoFecha = null;
        this.estado = ESTADOS.RESERVADO;
        this.historialEstados.push({
            fechaHora: new Date().toISOString(),
            estado:    ESTADOS.RESERVADO,
            motivo:    "Propuesta del médico confirmada por el paciente",
        });
    }

    // El paciente rechaza la propuesta → fecha original, vuelve a RESERVADO.
    rechazarPropuestaMedico() {
        this.propuestaMedicoFecha = null;
        this.estado = ESTADOS.RESERVADO;
        this.historialEstados.push({
            fechaHora: new Date().toISOString(),
            estado:    ESTADOS.RESERVADO,
            motivo:    "Propuesta del médico rechazada por el paciente",
        });
    }

    toJSON() {
        return {
            turno_id:             this.id,
            medico_id:            this.medicoId,
            paciente_id:          this.pacienteId,
            fecha:                this.fecha,
            hora:                 this.hora,
            duracion:             this.duracion,
            estado:               this.estado,
            fechaCreacion:        this.fechaCreacion,
            historialEstados:     this.historialEstados,
            solicitudCambioFecha: this.solicitudCambioFecha,
            propuestaMedicoFecha: this.propuestaMedicoFecha,
            snapshotMedico:       this.snapshotMedico,
            snapshotPaciente:     this.snapshotPaciente,
        };
    }

    // --- Solapamiento de slots ----------------------------------------------

    // Condición de solapamiento entre [a, b) y [c, d): a < d && c < b
    // Intervalos adyacentes NO se solapan — son turnos consecutivos válidos.
    seSuperponeConSlot(horaInicio, duracion) {
        const inicioEste  = horaAMinutos(this.hora);
        const finEste     = inicioEste + this.duracion;
        const inicioNuevo = horaAMinutos(horaInicio);
        const finNuevo    = inicioNuevo + duracion;
        return inicioEste < finNuevo && inicioNuevo < finEste;
    }
}
