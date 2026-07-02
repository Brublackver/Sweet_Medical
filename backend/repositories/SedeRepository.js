import SedeModel       from "../models/SedeModel.js";
import ContadorModel   from "../models/ContadorModel.js";

export class SedeRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "sede" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    // Siembra las sedes iniciales si la colección está vacía.
    inicializar() {
        return SedeModel.countDocuments()
            .then((count) => {
                if (count > 0) return;
                return this.crear({ nombre: "Medrano",  direccion: "Av. Medrano 950" })
                    .then(() => this.crear({ nombre: "Campus", direccion: "Mozart 2300" }));
            });
    }

    obtenerTodos() {
        return SedeModel.find();
    }

    obtenerPorId(id) {
        return SedeModel.findOne({ sedeId: id });
    }

    existeNombre(nombre) {
        return SedeModel.findOne({ nombre: new RegExp(`^${nombre.trim()}$`, "i") })
            .then((doc) => !!doc);
    }

    crear(datos) {
        return this._siguienteId()
            .then((sedeId) => new SedeModel({
                sedeId,
                nombre:    datos.nombre.trim(),
                direccion: datos.direccion.trim(),
            }).save());
    }
}
