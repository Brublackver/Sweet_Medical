import { Personal } from "../../domain/Personal.js";

// Fake en memoria del PersonalRepository para tests unitarios.
export class FakePersonalRepository {
    constructor() {
        this._store  = new Map();
        this._nextId = 1;
    }

    obtenerTodos(filtros = {}) {
        return Promise.resolve(
            [...this._store.values()].filter((p) =>
                (filtros.tipo   === undefined || p.tipo   === filtros.tipo) &&
                (filtros.activo === undefined || p.activo === filtros.activo)
            )
        );
    }

    obtenerPorId(id) {
        return Promise.resolve(this._store.get(id) ?? null);
    }

    existeDocumento(documento, excluirId = null) {
        return Promise.resolve(
            [...this._store.values()].some((p) =>
                p.documento === documento.trim() && p.id !== excluirId
            )
        );
    }

    crear(datos) {
        const personal = new Personal(this._nextId++, datos);
        if (datos.activo !== undefined) personal.activo = datos.activo;
        this._store.set(personal.id, personal);
        return Promise.resolve(personal);
    }

    actualizar(personal) {
        this._store.set(personal.id, personal);
        return Promise.resolve(personal);
    }

    eliminar(id) {
        const personal = this._store.get(id) ?? null;
        this._store.delete(id);
        return Promise.resolve(personal);
    }
}
