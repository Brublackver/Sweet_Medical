import PacienteModel  from "../models/PacienteModel.js";
import ContadorModel  from "../models/ContadorModel.js";

export class PacienteRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "paciente" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    obtenerTodos() {
        return PacienteModel.find();
    }

    obtenerPorId(id) {
        return PacienteModel.findOne({ pacienteId: id });
    }

    existeDni(dni) {
        return PacienteModel.findOne({ dni })
            .then((doc) => !!doc);
    }

    eliminar(id) {
        return PacienteModel.deleteOne({ pacienteId: id });
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
            }).save());
    }
}
