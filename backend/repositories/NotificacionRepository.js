import { Notificacion }   from "../domain/Notificacion.js";
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
            }).save())
            .then((doc) => this._toNotificacion(doc.toObject()));
    }

    obtenerPorId(id) {
        return NotificacionModel.findOne({ notificacionId: id }).lean()
            .then((doc) => doc ? this._toNotificacion(doc) : null);
    }

    // leida = true → solo leídas | leida = false → solo sin leer | undefined → todas
    obtenerPorUsuario(usuarioId, leida) {
        const filtro = { usuarioId };
        if (leida !== undefined) filtro.leida = leida;
        return NotificacionModel.find(filtro).lean()
            .then((docs) => docs.map(this._toNotificacion));
    }

    actualizar(notificacion) {
        return NotificacionModel.findOneAndUpdate(
            { notificacionId: notificacion.id },
            { leida: notificacion.leida },
            { new: true }
        ).lean()
            .then((doc) => this._toNotificacion(doc));
    }

    _toNotificacion(doc) {
        const n = new Notificacion(doc.notificacionId, doc.usuarioId, doc.tipo, doc.mensaje);
        n.leida         = doc.leida;
        n.fechaCreacion = doc.fechaCreacion || n.fechaCreacion;
        return n;
    }
}
