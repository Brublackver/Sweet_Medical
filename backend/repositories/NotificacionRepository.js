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

    crear(usuarioId, tipo, mensaje) {
        const ahora = new Date().toISOString();
        return this._siguienteId()
            .then((notificacionId) => new NotificacionModel({
                notificacionId, usuarioId, tipo, mensaje, fechaCreacion: ahora,
            }).save());
    }

    obtenerPorId(id) {
        return NotificacionModel.findOne({ notificacionId: id });
    }

    // leida = true → solo leídas | leida = false → solo sin leer | undefined → todas
    obtenerPorUsuario(usuarioId, leida) {
        const filtro = { usuarioId };
        if (leida !== undefined) filtro.leida = leida;
        return NotificacionModel.find(filtro);
    }

    actualizar(notificacion) {
        return NotificacionModel.findOneAndUpdate(
            { notificacionId: notificacion.id },
            { leida: notificacion.leida },
            { new: true }
        );
    }
}
