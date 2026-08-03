import ObraSocialModel from "../models/ObraSocialModel.js";
import ContadorModel    from "../models/ContadorModel.js";

/*
    REPOSITORY — Catálogo de Obras Sociales

    Los PLANES siguen definidos en código: son datos maestros y nadie los edita
    desde la app (el paciente solo elige de la lista). En cada arranque se
    sincroniza código ⇄ base.

    IMPORTANTE — la sincronización ya NO borra la colección. Antes hacía
    deleteMany({}) y volvía a sembrar; con la suscripción viviendo dentro de la
    obra social, eso significaba perder los contratos en CADA reinicio. Ahora se
    hace upsert por nombre: los planes se pisan con lo que dice el código, y el
    estado de alta y la suscripción (que SÍ se administran desde la app) se
    respetan tal como estaban.
*/

// Semilla del catálogo. Solo planes: la suscripción es un dato de gestión, no
// una constante del sistema, y por eso nunca se siembra desde acá.
const CATALOGO_INICIAL = [
    {
        nombre: "OSDE",
        planes: [
            { nombre: "110", coberturaGeneral: 0 },
            { nombre: "210", coberturaGeneral: 25 },
            { nombre: "310", coberturaGeneral: 50 },
            { nombre: "410", coberturaGeneral: 100 },
        ],
    },
    {
        nombre: "Swiss Medical",
        planes: [
            { nombre: "Basic",  coberturaGeneral: 0 },
            { nombre: "Bronze", coberturaGeneral: 25 },
            { nombre: "Silver", coberturaGeneral: 50 },
            { nombre: "Gold",   coberturaGeneral: 100 },
        ],
    },
];

export class ObraSocialRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "obraSocial" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    // Sincroniza el catálogo del código con la base, preservando lo que se
    // administra desde la app (alta/baja y suscripción). Secuencial a propósito:
    // _siguienteId es un contador compartido y no queremos carreras al sembrar.
    inicializar() {
        return CATALOGO_INICIAL.reduce(
            (cadena, semilla) => cadena.then(() =>
                ObraSocialModel.findOne({ nombre: semilla.nombre })
                    .then((existente) => {
                        if (!existente) return this.crear(semilla);
                        existente.planes = semilla.planes;
                        return existente.save();
                    })
            ),
            Promise.resolve()
        );
    }

    // filtros: { activa?: boolean, vigente?: boolean }
    // `vigente` no se puede resolver en la query porque depende de comparar el
    // vencimiento contra hoy: se filtra en memoria con la regla del dominio,
    // que es la MISMA que usa toJSON. El catálogo es chico, no hay problema.
    obtenerTodos(filtros = {}) {
        const query = {};
        if (filtros.activa !== undefined) query.activa = filtros.activa;

        return ObraSocialModel.find(query).then((obrasSociales) => {
            if (filtros.vigente === undefined) return obrasSociales;
            return obrasSociales.filter((os) => os.suscripcionVigente() === filtros.vigente);
        });
    }

    obtenerPorId(id) {
        return ObraSocialModel.findOne({ obraSocialId: id });
    }

    existeNombre(nombre) {
        return ObraSocialModel.findOne({ nombre: new RegExp(`^${nombre.trim()}$`, "i") })
            .then((doc) => !!doc);
    }

    crear(datos) {
        return this._siguienteId()
            .then((obraSocialId) => new ObraSocialModel({
                obraSocialId,
                nombre:      datos.nombre.trim(),
                planes:      datos.planes || [],
                activa:      datos.activa !== undefined ? datos.activa : true,
                suscripcion: datos.suscripcion || null,
            }).save());
    }

    // El documento ya viene mutado por los métodos de dominio (registrarSuscripcion,
    // desactivar, ...). Acá solo se persiste.
    actualizar(obraSocial) {
        return obraSocial.save();
    }
}
