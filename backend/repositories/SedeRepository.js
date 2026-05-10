/*
    REPOSITORY — Acceso a datos para Sedes (MongoDB)

    Las sedes son entidades independientes referenciadas por los médicos.
    Se inicializan con dos sedes de ejemplo al arrancar si la colección está vacía.
*/

import { Sede }      from "../domain/Sede.js";
import SedeModel     from "../models/SedeModel.js";

export class SedeRepository {

    // Siembra las sedes iniciales si la colección está vacía.
    inicializar() {
        return SedeModel.countDocuments()
            .then((count) => {
                if (count > 0) return;
                return SedeModel.insertMany([
                    { nombre: "Medrano",  direccion: "Av. Medrano 950" },
                    { nombre: "Campus",   direccion: "Mozart 2300" },
                ]);
            });
    }

    obtenerTodos() {
        return SedeModel.find().lean()
            .then((docs) => docs.map(this._toSede));
    }

    obtenerPorId(id) {
        return SedeModel.findById(id).lean()
            .then((doc) => doc ? this._toSede(doc) : null);
    }

    existeNombre(nombre) {
        return SedeModel.findOne({ nombre: new RegExp(`^${nombre.trim()}$`, "i") }).lean()
            .then((doc) => !!doc);
    }

    crear(datos) {
        return new SedeModel({ nombre: datos.nombre.trim(), direccion: datos.direccion.trim() })
            .save()
            .then((doc) => this._toSede(doc.toObject()));
    }

    _toSede(doc) {
        return new Sede(doc._id.toString(), doc.nombre, doc.direccion);
    }
}
