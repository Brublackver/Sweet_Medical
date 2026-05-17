import { Medico } from "../../domain/Medico.js";

/*
    Fake en memoria del MedicoRepository para tests unitarios.
    Almacena por referencia: las mutaciones directas sobre el objeto
    devuelto por crear/obtenerPorId son visibles en lecturas posteriores.
*/
export class FakeMedicoRepository {
    constructor() {
        this._store  = new Map();
        this._nextId = 1;
    }

    crear(datos) {
        const medico = new Medico(this._nextId++, datos.usuario, datos.matricula, datos.nombre);
        this._store.set(medico.id, medico);
        return Promise.resolve(medico);
    }

    obtenerPorId(id) {
        return Promise.resolve(this._store.get(id) ?? null);
    }

    obtenerTodos() {
        return Promise.resolve([...this._store.values()]);
    }

    actualizar(medico) {
        this._store.set(medico.id, medico);
        return Promise.resolve(medico);
    }
}
