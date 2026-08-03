import { Schema, model } from "mongoose";
import { ObraSocial, ESTADOS_SUSCRIPCION } from "../domain/ObraSocial.js";

// Plan embebido: nombre + porcentaje de cobertura general (0–100) que aplica a
// todos los servicios. Misma forma que el plan que guarda el Paciente.
const planSchema = new Schema({
    nombre:           { type: String, required: true },
    coberturaGeneral: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

// Característica libre de la suscripción. Es el punto de extensión: nuevas
// condiciones (topes, copagos, modalidades) entran acá SIN migrar el schema.
const caracteristicaSchema = new Schema({
    clave: { type: String, required: true, trim: true },
    valor: { type: String, required: true, trim: true },
}, { _id: false });

// Suscripción embebida: el contrato de la obra social con la clínica. Es 1:1 con
// la obra social, se lee y se escribe siempre junto a ella y no tiene sentido
// por separado — por eso va embebida y no en su propia colección.
const suscripcionSchema = new Schema({
    modalidad:        { type: String, default: "ESTANDAR", trim: true },
    estado:           { type: String, enum: Object.values(ESTADOS_SUSCRIPCION), default: ESTADOS_SUSCRIPCION.ACTIVA },
    fechaInicio:      { type: String, default: null },
    fechaVencimiento: { type: String, default: null },
    contacto:         { type: String, default: null, trim: true },
    observaciones:    { type: String, default: null, trim: true },
    caracteristicas:  { type: [caracteristicaSchema], default: [] },
}, { _id: false });

const obraSocialSchema = new Schema({
    obraSocialId: { type: Number, required: true, unique: true },
    nombre:       { type: String, required: true, trim: true },
    planes:       { type: [planSchema], default: [] },
    // Alta/baja del catálogo. Independiente del estado de la suscripción.
    activa:       { type: Boolean, default: true },
    suscripcion:  { type: suscripcionSchema, default: null },
}, { timestamps: true, id: false });

obraSocialSchema.virtual('id').get(function() { return this.obraSocialId; });
obraSocialSchema.loadClass(ObraSocial);

export default model("ObraSocial", obraSocialSchema);
