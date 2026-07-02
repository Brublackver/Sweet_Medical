import NotificacionModel  from "../models/NotificacionModel.js";
import ContadorModel      from "../models/ContadorModel.js";

export class NotificacionRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "notificacion" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    crear(usuarioTipo, usuarioId, tipo, mensaje, turnoId = null) {
        const ahora = new Date().toISOString();
        return this._siguienteId()
            .then((notificacionId) => new NotificacionModel({
                notificacionId, usuarioTipo, usuarioId, tipo, mensaje, turnoId, fechaCreacion: ahora,
            }).save());
    }

    obtenerPorId(id) {
        return NotificacionModel.findOne({ notificacionId: id });
    }

    // Filtra por destinatario (clave compuesta usuarioTipo + usuarioId).
    // leida = true → solo leídas | leida = false → solo sin leer | undefined → todas
    obtenerPorUsuario(usuarioTipo, usuarioId, leida) {
        const filtro = { usuarioTipo, usuarioId };
        if (leida !== undefined) filtro.leida = leida;
        return NotificacionModel.find(filtro);
    }

    actualizar(notificacion) {
        return NotificacionModel.findOneAndUpdate(
            { notificacionId: notificacion.id },
            { leida: notificacion.leida, resultado: notificacion.resultado ?? null },
            { new: true }
        );
    }
}
