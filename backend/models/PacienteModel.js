import { Schema, model } from "mongoose";

// Coberturas embebidas dentro del plan — no tienen existencia independiente
const coberturaEspecialidadSchema = new Schema({
    especialidad: { codigo: String, nombre: String },
    nivel:        { type: Number, min: 0, max: 100 },
}, { _id: false });

const coberturaPracticaSchema = new Schema({
    practica: { codigo: String, nombre: String },
    nivel:    { type: Number, min: 0, max: 100 },
}, { _id: false });

const planSchema = new Schema({
    nombre:                 String,
    coberturasEspecialidad: [coberturaEspecialidadSchema],
    coberturasPractica:     [coberturaPracticaSchema],
}, { _id: false });

const pacienteSchema = new Schema({
    usuario:    { type: String, required: true, trim: true },
    dni:        { type: String, required: true, unique: true },
    nombre:     { type: String, required: true, trim: true },
    obraSocial: { nombre: String },
    plan:       planSchema,
});

export default model("Paciente", pacienteSchema);
