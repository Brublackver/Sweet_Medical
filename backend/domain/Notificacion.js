/*
    DOMAIN — Entidad Notificacion

    Representa un mensaje interno generado por el sistema hacia un usuario.
    Las notificaciones son de solo lectura para el sistema — el único cambio
    de estado permitido es marcarlas como leídas.
*/

export class Notificacion {
    constructor(id, usuarioId, tipo, mensaje) {
        this.id            = id;
        this.usuarioId     = usuarioId; // id del paciente o médico destinatario
        this.tipo          = tipo;      // categoría del evento ("PROPUESTA_CAMBIO_FECHA", etc.)
        this.mensaje       = mensaje;   // texto legible para mostrar al usuario
        this.leida         = false;
        this.fechaCreacion = new Date().toISOString();
    }

    // Marca la notificación como leída. Transición única e irreversible.
    marcarLeida() {
        this.leida = true;
    }

    toJSON() {
        return {
            notificacion_id: this.id,
            usuario_id:      this.usuarioId,
            tipo:            this.tipo,
            mensaje:         this.mensaje,
            leida:           this.leida,
            fechaCreacion:   this.fechaCreacion,
        };
    }
}
