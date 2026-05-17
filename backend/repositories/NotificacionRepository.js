/*
    REPOSITORY — Acceso a datos para Notificaciones (MongoDB)

    Las notificaciones nunca se eliminan físicamente.
    Solo cambian de estado: leida: false → leida: true.
*/

import { Notificacion }   from "../domain/Notificacion.js";
import NotificacionModel  from "../models/NotificacionModel.js";

export class NotificacionRepository {

    crear(usuarioId, tipo, mensaje) {
        const ahora = new Date().toISOString();
        return new NotificacionModel({ usuarioId, tipo, mensaje, fechaCreacion: ahora })
            .save()
            .then((doc) => this._toNotificacion(doc.toObject()));
    }

    obtenerPorId(id) {
        return NotificacionModel.findById(id).lean()
            .then((doc) => doc ? this._toNotificacion(doc) : null);
    }

    obtenerSinLeerPorUsuario(usuarioId) {
        return NotificacionModel.find({ usuarioId, leida: false }).lean()
            .then((docs) => docs.map(this._toNotificacion));
    }

    obtenerLeidasPorUsuario(usuarioId) {
        return NotificacionModel.find({ usuarioId, leida: true }).lean()
            .then((docs) => docs.map(this._toNotificacion));
    }

    // Persiste el cambio de estado (leida: true) en MongoDB.
    actualizar(notificacion) {
        return NotificacionModel.findByIdAndUpdate(
            notificacion.id,
            { leida: notificacion.leida },
            { new: true }
        ).lean()
            .then((doc) => this._toNotificacion(doc));
    }

    _toNotificacion(doc) {
        const n = new Notificacion(doc._id.toString(), doc.usuarioId, doc.tipo, doc.mensaje);
        n.leida         = doc.leida;
        n.fechaCreacion = doc.fechaCreacion || n.fechaCreacion;
        return n;
    }
}
