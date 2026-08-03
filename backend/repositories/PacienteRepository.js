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

    // Trae la credencial (incluido el hash) para autenticar. select("+password")
    // porque el campo está oculto por defecto en el modelo.
    obtenerCredencialPorUsuario(usuario) {
        return PacienteModel.findOne({ usuario }).select("+password").lean()
            .then((doc) => doc
                ? { id: doc.pacienteId, usuario: doc.usuario, password: doc.password }
                : null
            );
    }

    existeDni(dni) {
        return PacienteModel.findOne({ dni })
            .then((doc) => !!doc);
    }

    // Actualiza solo el hash de la contraseña. El hash llega listo desde el service.
    actualizarPassword(id, hash) {
        return PacienteModel.findOneAndUpdate(
            { pacienteId: id },
            { password: hash },
            { new: true }
        );
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
                password:   datos.password, // ya viene hasheada desde el service
                dni:        datos.dni,
                nombre:     datos.nombre,
                obraSocial: datos.obraSocial,
                plan:       datos.plan,
                esDemo:     datos.esDemo   === true,
                expiraEn:   datos.expiraEn ?? null,
            }).save());
    }

    // --- Cuentas demo -------------------------------------------------------

    // Número incremental para armar identificadores únicos de invitado
    // (usuario y DNI). Contador propio, separado del de pacientes.
    siguienteNumeroDemo() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "pacienteDemo" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    // Cuentas demo cuyo plazo ya venció. Son las que hay que barrer.
    obtenerDemosExpirados(ahora = new Date()) {
        return PacienteModel.find({ esDemo: true, expiraEn: { $lte: ahora } });
    }
}
