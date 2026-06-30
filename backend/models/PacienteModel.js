import { Schema, model } from "mongoose";
import { Paciente } from "../domain/Paciente.js";

// El plan del paciente guarda el porcentaje de cobertura general (0–100) que se
// copió del catálogo al crear la cuenta. La cobertura se calcula con este valor.
const planSchema = new Schema({
    nombre:           { type: String },
    coberturaGeneral: { type: Number },
}, { _id: false });

const pacienteSchema = new Schema({
    pacienteId: { type: Number, required: true, unique: true },
    usuario:    { type: String, required: true, trim: true },
    // select:false → el hash nunca viaja en las consultas/respuestas normales.
    // Para login se trae explícitamente con .select("+password").
    password:   { type: String, required: true, select: false },
    dni:        { type: String, required: true, unique: true },
    nombre:     { type: String, required: true, trim: true },
    obraSocial: { type: String },
    plan:       { type: planSchema },
}, { timestamps: true, id: false });
pacienteSchema.virtual('id').get(function() { return this.pacienteId; });
pacienteSchema.loadClass(Paciente);
export default model("Paciente", pacienteSchema);
