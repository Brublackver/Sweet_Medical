/*
    DOMAIN — Entidad Notificacion

    Representa un mensaje interno generado por el sistema hacia un usuario.
    Las notificaciones son de solo lectura para el sistema — el único cambio
    de estado permitido es marcarlas como leídas.

    El destinatario se identifica por la clave compuesta (usuarioTipo, usuarioId):
    médicos y pacientes tienen contadores de id separados, por lo que el id solo
    NO alcanza para desambiguar a quién pertenece la notificación.
*/

// Tipo de destinatario. La clave compuesta (usuarioTipo, usuarioId) evita
// colisiones entre médico 1 y paciente 1.
export const USUARIO_TIPOS = Object.freeze({
    MEDICO:   "MEDICO",
    PACIENTE: "PACIENTE",
});

// Categorías de evento que disparan una notificación.
export const TIPOS_NOTIFICACION = Object.freeze({
    TURNO_CANCELADO:        "TURNO_CANCELADO",
    SOLICITUD_CAMBIO_FECHA: "SOLICITUD_CAMBIO_FECHA", // paciente pide cambio → médico
    PROPUESTA_CAMBIO_FECHA: "PROPUESTA_CAMBIO_FECHA", // médico propone cambio → paciente
    CAMBIO_CONFIRMADO:      "CAMBIO_CONFIRMADO",
    CAMBIO_RECHAZADO:       "CAMBIO_RECHAZADO",
});

// Cómo se resolvió una notificación accionable. Queda guardado de forma permanente.
export const RESULTADOS = Object.freeze({
    ACEPTADO:  "ACEPTADO",
    RECHAZADO: "RECHAZADO",
});

export class Notificacion {
    constructor(id, usuarioTipo, usuarioId, tipo, mensaje, turnoId = null) {
        this.id            = id;
        this.usuarioTipo   = usuarioTipo; // "MEDICO" | "PACIENTE"
        this.usuarioId     = usuarioId;   // id del paciente o médico destinatario
        this.tipo          = tipo;        // categoría del evento (ver TIPOS_NOTIFICACION)
        this.mensaje       = mensaje;     // texto legible para mostrar al usuario
        this.turnoId       = turnoId;     // turno al que refiere (para accionar desde la campana)
        this.leida         = false;
        this.resultado     = null;        // "ACEPTADO" | "RECHAZADO" si fue una notificación accionable resuelta
        this.fechaCreacion = new Date().toISOString();
    }

    // Marca la notificación como leída. Transición única e irreversible.
    marcarLeida() {
        this.leida = true;
    }

    // Registra cómo se resolvió una notificación accionable (y la marca leída).
    // Queda guardado para siempre como "aceptado" o "rechazado".
    marcarResuelta(resultado) {
        this.leida     = true;
        this.resultado = resultado;
    }

    toJSON() {
        return {
            notificacion_id: this.id,
            usuario_tipo:    this.usuarioTipo,
            usuario_id:      this.usuarioId,
            tipo:            this.tipo,
            mensaje:         this.mensaje,
            turno_id:        this.turnoId ?? null,
            leida:           this.leida,
            resultado:       this.resultado ?? null,
            fechaCreacion:   this.fechaCreacion,
        };
    }
}
