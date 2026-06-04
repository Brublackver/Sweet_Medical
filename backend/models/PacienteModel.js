import { Schema, model } from "mongoose";
import { Paciente } from "../domain/Paciente.js";

const coberturaEspecialidadSchema = new Schema({
    especialidad: { codigo: { type: String } },
    nivel:        { type: Number },
}, { _id: false });

const coberturaPracticaSchema = new Schema({
    practica: { codigo: { type: String } },
    nivel:    { type: Number },
}, { _id: false });

const planSchema = new Schema({
    nombre:                 { type: String },
    coberturasEspecialidad: { type: [coberturaEspecialidadSchema], default: [] },
    coberturasPractica:     { type: [coberturaPracticaSchema],     default: [] },
}, { _id: false });

const pacienteSchema = new Schema({
    pacienteId: { type: Number, required: true, unique: true },
    usuario:    { type: String, required: true, trim: true },
    dni:        { type: String, required: true, unique: true },
    nombre:     { type: String, required: true, trim: true },
    obraSocial: { type: String },
    plan:       { type: planSchema },
}, { timestamps: true, id: false });
pacienteSchema.virtual('id').get(function() { return this.pacienteId; });
pacienteSchema.loadClass(Paciente);
export default model("Paciente", pacienteSchema);
