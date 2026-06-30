import { Notificacion } from "../../domain/Notificacion.js";

/*
    Fake en memoria del NotificacionRepository para tests unitarios.
    Respeta la clave compuesta (usuarioTipo, usuarioId).
*/
export class FakeNotificacionRepository {
    constructor() {
        this._store  = new Map();
        this._nextId = 1;
    }

    crear(usuarioTipo, usuarioId, tipo, mensaje, turnoId = null) {
        const notificacion = new Notificacion(this._nextId++, usuarioTipo, usuarioId, tipo, mensaje, turnoId);
        this._store.set(notificacion.id, notificacion);
        return Promise.resolve(notificacion);
    }

    obtenerPorId(id) {
        return Promise.resolve(this._store.get(id) ?? null);
    }

    obtenerPorUsuario(usuarioTipo, usuarioId, leida) {
        return Promise.resolve(
            [...this._store.values()].filter((n) =>
                n.usuarioTipo === usuarioTipo &&
                n.usuarioId === usuarioId &&
                (leida === undefined || n.leida === leida)
            )
        );
    }

    actualizar(notificacion) {
        this._store.set(notificacion.id, notificacion);
        return Promise.resolve(notificacion);
    }
}
