/*
    REPOSITORY — Capa de acceso a datos para Pacientes

    ABSTRACCIÓN: el Service desconoce el mecanismo de persistencia.
    Cuando migremos a MongoDB, solo cambia esta clase.
*/

import { Paciente } from "../domain/Paciente.js";

export class PacienteRepository {
    constructor() {
        this.pacientes = [];
        this.nextId    = 1;
    }

    obtenerTodos() {
        return Promise.resolve(this.pacientes);
    }

    obtenerPorId(id) {
        const paciente = this.pacientes.find((p) => p.id === id) || null;
        return Promise.resolve(paciente);
    }

    // DECLARATIVIDAD: la condición de unicidad de DNI se expresa como dato
    // en some(), no como un loop con break.
    existeDni(dni) {
        return Promise.resolve(
            this.pacientes.some((p) => p.dni === dni)
        );
    }

    crear(datos) {
        const nuevoPaciente = new Paciente(
            this.nextId++,
            datos.usuario,
            datos.dni,
            datos.nombre,
            datos.obraSocial,
            datos.plan,
        );
        this.pacientes.push(nuevoPaciente);
        return Promise.resolve(nuevoPaciente);
    }
}
