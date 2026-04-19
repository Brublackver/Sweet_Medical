/*
    REPOSITORY
*/

import {Medico} from "../domain/Medico.js";

export class MedicoRepository {
    constructor() {
        // POR AHORA HARDCODEADO
        this.medicos = [null, new Medico(1, "Alise", "0XX0XX0", "Alise")]
        this.nextId = 1
    }

    obtenerPorId(id) {
        return this.medicos[id];
    }

    // POR AHORA NO SE USA
    // guardar(medico) {
    //     const id = medico.id ?? this.nextId++
    //     medico.id = id;
    //     this.medicos[id] = medico;
    //
    //     return medico;
    // }
}