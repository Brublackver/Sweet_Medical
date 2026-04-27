/*
    REPOSITORY — Capa de acceso a datos
    Recibe pedidos del Service y devuelve datos desde el almacenamiento en memoria.
    Cada metodo retorna una Promise para mantener consistencia con futuras bases de datos.
*/

import { Medico } from "../domain/Medico.js";

export class MedicoRepository {
    constructor() {
        this.medicos = [];
        this.nextId = 1;
    }

    // Devuelve todos los medicos almacenados → Promise<Medico[]>
    // Viene de: MedicoService.obtenerTodos()
    // Va hacia: MedicoController como respuesta JSON
    obtenerTodos() {
        return Promise.resolve(this.medicos);
    }

    obtenerMedico() {
        return Promise.resolve(this.medicos);
    }


    // Busca un medico por su id → Promise<Medico|null>
    // Recibe: id (number) desde MedicoService.validarMedico()
    // Va hacia: MedicoService para validar existencia
    obtenerPorId(id) {
        const medico = this.medicos.find((m) => m.id === id) || null;
        return Promise.resolve(medico);
    }

    // Crea un nuevo medico con id autoincrementado → Promise<Medico>
    // Recibe: datos validados { usuario, nombre, matricula } desde MedicoService.crear()
    // Va hacia: MedicoService → MedicoController como respuesta 201
    crear(datos) {
        const nuevoMedico = new Medico(this.nextId++, datos.usuario, datos.matricula, datos.nombre);
        this.medicos.push(nuevoMedico);
        return Promise.resolve(nuevoMedico);
    }
}
