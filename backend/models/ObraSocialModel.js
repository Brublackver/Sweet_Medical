import { Schema, model } from "mongoose";
import { ObraSocial } from "../domain/ObraSocial.js";

// Plan embebido: nombre + porcentaje de cobertura general (0–100) que aplica a
// todos los servicios. Misma forma que el plan que guarda el Paciente.
const planSchema = new Schema({
    nombre:           { type: String, required: true },
    coberturaGeneral: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const obraSocialSchema = new Schema({
    obraSocialId: { type: Number, required: true, unique: true },
    nombre:       { type: String, required: true, trim: true },
    planes:       { type: [planSchema], default: [] },
}, { timestamps: true, id: false });

obraSocialSchema.virtual('id').get(function() { return this.obraSocialId; });
obraSocialSchema.loadClass(ObraSocial);

export default model("ObraSocial", obraSocialSchema);
