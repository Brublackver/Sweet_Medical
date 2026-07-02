import ObraSocialModel from "../models/ObraSocialModel.js";
import ContadorModel    from "../models/ContadorModel.js";

/*
    REPOSITORY — Catálogo de Obras Sociales (datos maestros, solo lectura)

    El catálogo está DEFINIDO EN CÓDIGO. En cada arranque se sincroniza (se borra
    y se vuelve a sembrar) para que la base siempre refleje exactamente lo que
    dice el código. Nadie lo edita desde la app: el paciente solo elige de la lista.
*/
export class ObraSocialRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "obraSocial" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    // Borra el catálogo, reinicia el contador y re-siembra OSDE y Swiss Medical
    // con sus planes. Sincroniza código ⇄ base en cada arranque.
    inicializar() {
        return ObraSocialModel.deleteMany({})
            .then(() => ContadorModel.findOneAndUpdate(
                { nombre: "obraSocial" },
                { $set: { valor: 0 } },
                { upsert: true }
            ))
            .then(() => this.crear({
                nombre: "OSDE",
                planes: [
                    { nombre: "110", coberturaGeneral: 0 },
                    { nombre: "210", coberturaGeneral: 25 },
                    { nombre: "310", coberturaGeneral: 50 },
                    { nombre: "410", coberturaGeneral: 100 },
                ],
            }))
            .then(() => this.crear({
                nombre: "Swiss Medical",
                planes: [
                    { nombre: "Basic",  coberturaGeneral: 0 },
                    { nombre: "Bronze", coberturaGeneral: 25 },
                    { nombre: "Silver", coberturaGeneral: 50 },
                    { nombre: "Gold",   coberturaGeneral: 100 },
                ],
            }));
    }

    obtenerTodos() {
        return ObraSocialModel.find();
    }

    crear(datos) {
        return this._siguienteId()
            .then((obraSocialId) => new ObraSocialModel({
                obraSocialId,
                nombre: datos.nombre.trim(),
                planes: datos.planes || [],
            }).save());
    }
}
