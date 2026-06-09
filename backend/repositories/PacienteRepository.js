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

    agregarCoberturaEspecialidad(pacienteId, cobertura) {
        return PacienteModel.findOneAndUpdate(
            { pacienteId },
            { $push: { "plan.coberturasEspecialidad": cobertura } },
            { new: true }
        );
    }

    quitarCoberturaEspecialidad(pacienteId, codigo) {
        return PacienteModel.findOneAndUpdate(
            { pacienteId },
            { $pull: { "plan.coberturasEspecialidad": { "especialidad.codigo": codigo } } },
            { new: true }
        );
    }

    agregarCoberturaPractica(pacienteId, cobertura) {
        return PacienteModel.findOneAndUpdate(
            { pacienteId },
            { $push: { "plan.coberturasPractica": cobertura } },
            { new: true }
        );
    }

    quitarCoberturaPractica(pacienteId, codigo) {
        return PacienteModel.findOneAndUpdate(
            { pacienteId },
            { $pull: { "plan.coberturasPractica": { "practica.codigo": codigo } } },
            { new: true }
        );
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
