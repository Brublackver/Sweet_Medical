/*
    DOMAIN — Entidad Turno

    Encapsula el ciclo de vida completo de un turno médico.

    ENCAPSULAMIENTO (POO): ningún actor externo muta el estado directamente.
    Toda transición pasa por un método que valida la precondición y registra el evento.

    PATRÓN ESTADO: los métodos puedeXxx() actúan como guardas de transición —
    expresan QUÉ está permitido sin que el llamador conozca la lógica interna.

    INMUTABILIDAD PARCIAL: ESTADOS es un objeto congelado para evitar
    strings mágicos dispersos en el código.
*/

export const ESTADOS = Object.freeze({
    RESERVADO:        "reservado",
    CANCELADO:        "cancelado",
    PENDIENTE_CAMBIO: "pendiente_cambio",   // paciente solicitó cambio → espera médico
    PROPUESTA_MEDICO: "propuesta_medico",   // médico propuso cambio → espera paciente
    REALIZADO:        "realizado",
});

// TRANSPARENCIA REFERENCIAL: función pura, sin efectos secundarios.
const horaAMinutos = (hora) => {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
};

export class Turno {
    constructor(id, medicoId, pacienteId, fecha, hora, duracion) {
        this.id         = id;
        this.medicoId   = medicoId;
        this.pacienteId = pacienteId;
        this.fecha      = fecha;
        this.hora       = hora;
        this.duracion   = duracion;
        this.estado     = ESTADOS.RESERVADO;
        this.fechaCreacion = new Date().toISOString();

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
        const fechaTurno = new Date(`${this.fecha}T${this.hora}:00`);
        return (fechaTurno - new Date()) / (1000 * 60 * 60) >= 1;
    }

    // DECLARATIVIDAD: includes() expresa el conjunto de estados cancelables como dato.
    puedeSerCancelado() {
        return [ESTADOS.RESERVADO, ESTADOS.PENDIENTE_CAMBIO, ESTADOS.PROPUESTA_MEDICO]
            .includes(this.estado) && this.puedeCancelarse();
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
        const estadosActivos = [ESTADOS.RESERVADO, ESTADOS.PENDIENTE_CAMBIO, ESTADOS.PROPUESTA_MEDICO];
        if (!estadosActivos.includes(this.estado)) return false;
        const fechaTurno = new Date(`${this.fecha}T${this.hora}:00`);
        return fechaTurno <= new Date();
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

    puedeProponecrCambioFecha() {
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
