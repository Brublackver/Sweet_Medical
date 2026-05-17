import { Paciente } from "../../domain/Paciente.js";

/*
    Fake en memoria del PacienteRepository para tests unitarios.
*/
export class FakePacienteRepository {
    constructor() {
        this._store  = new Map();
        this._nextId = 1;
    }

    crear(datos) {
        const paciente = new Paciente(
            this._nextId++, datos.usuario, datos.dni, datos.nombre, datos.obraSocial, datos.plan
        );
        this._store.set(paciente.id, paciente);
        return Promise.resolve(paciente);
    }

    obtenerPorId(id) {
        return Promise.resolve(this._store.get(id) ?? null);
    }

    obtenerTodos() {
        return Promise.resolve([...this._store.values()]);
    }

    existeDni(dni) {
        return Promise.resolve(
            [...this._store.values()].some((p) => p.dni === dni)
        );
    }
}
