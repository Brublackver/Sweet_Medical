import PersonalModel  from "../models/PersonalModel.js";
import ContadorModel  from "../models/ContadorModel.js";

export class PersonalRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "personal" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    // filtros: { tipo?: string, activo?: boolean }
    // Se resuelven en la query (hay índice compuesto por tipo+activo).
    obtenerTodos(filtros = {}) {
        const query = {};
        if (filtros.tipo   !== undefined) query.tipo   = filtros.tipo;
        if (filtros.activo !== undefined) query.activo = filtros.activo;
        return PersonalModel.find(query).sort({ apellido: 1, nombre: 1 });
    }

    obtenerPorId(id) {
        return PersonalModel.findOne({ personalId: id });
    }

    // El documento es único. `excluirId` permite editar a alguien sin que choque
    // consigo mismo al reenviar su propio documento.
    existeDocumento(documento, excluirId = null) {
        const query = { documento: documento.trim() };
        if (excluirId !== null) query.personalId = { $ne: excluirId };
        return PersonalModel.findOne(query).then((doc) => !!doc);
    }

    crear(datos) {
        return this._siguienteId()
            .then((personalId) => new PersonalModel({
                personalId,
                nombre:        datos.nombre.trim(),
                apellido:      datos.apellido.trim(),
                documento:     datos.documento.trim(),
                telefono:      datos.telefono      ?? null,
                email:         datos.email         ?? null,
                tipo:          datos.tipo,
                sede:          datos.sede          ?? null,
                observaciones: datos.observaciones ?? null,
                activo:        datos.activo !== undefined ? datos.activo : true,
                fechaAlta:     new Date().toISOString().split("T")[0],
            }).save());
    }

    // El documento ya viene mutado por los métodos de dominio (actualizar,
    // desactivar, ...). Acá solo se persiste.
    actualizar(personal) {
        return personal.save();
    }

    eliminar(id) {
        return PersonalModel.findOneAndDelete({ personalId: id });
    }
}
