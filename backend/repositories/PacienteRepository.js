/*
    REPOSITORY — Acceso a datos para Pacientes (MongoDB)

    El plan y la obra social viajan embebidos en el documento del paciente.
    El DNI tiene índice unique en MongoDB — la validación de duplicados
    se hace en el service pero MongoDB también lo garantiza a nivel de base de datos.
*/

import { Paciente }    from "../domain/Paciente.js";
import PacienteModel   from "../models/PacienteModel.js";

export class PacienteRepository {

    obtenerTodos() {
        return PacienteModel.find().lean()
            .then((docs) => docs.map(this._toPaciente));
    }

    obtenerPorId(id) {
        return PacienteModel.findById(id).lean()
            .then((doc) => doc ? this._toPaciente(doc) : null);
    }

    // Verifica si ya existe un paciente con ese DNI.
    existeDni(dni) {
        return PacienteModel.findOne({ dni }).lean()
            .then((doc) => !!doc);
    }

    crear(datos) {
        return new PacienteModel({
            usuario:    datos.usuario,
            dni:        datos.dni,
            nombre:     datos.nombre,
            obraSocial: datos.obraSocial,
            plan:       datos.plan,
        }).save()
            .then((doc) => this._toPaciente(doc.toObject()));
    }

    _toPaciente(doc) {
        return new Paciente(
            doc._id.toString(),
            doc.usuario,
            doc.dni,
            doc.nombre,
            doc.obraSocial,
            doc.plan,
        );
    }
}
