import { Paciente }    from "../domain/Paciente.js";
import PacienteModel   from "../models/PacienteModel.js";
import ContadorModel   from "../models/ContadorModel.js";

export class PacienteRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "paciente" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    obtenerTodos() {
        return PacienteModel.find().lean()
            .then((docs) => docs.map(this._toPaciente));
    }

    obtenerPorId(id) {
        return PacienteModel.findOne({ pacienteId: id }).lean()
            .then((doc) => doc ? this._toPaciente(doc) : null);
    }

    // Verifica si ya existe un paciente con ese DNI.
    existeDni(dni) {
        return PacienteModel.findOne({ dni }).lean()
            .then((doc) => !!doc);
    }

    crear(datos) {
        return this._siguienteId()
            .then((pacienteId) => new PacienteModel({
                pacienteId,
                usuario:    datos.usuario,
                dni:        datos.dni,
                nombre:     datos.nombre,
                obraSocial: datos.obraSocial,
                plan:       datos.plan,
            }).save())
            .then((doc) => this._toPaciente(doc.toObject()));
    }

    _toPaciente(doc) {
        return new Paciente(
            doc.pacienteId,
            doc.usuario,
            doc.dni,
            doc.nombre,
            doc.obraSocial,
            doc.plan,
        );
    }
}
