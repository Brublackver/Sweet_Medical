import { Schema, model } from "mongoose";

const pacienteSchema = new Schema({
    pacienteId: { type: Number, required: true, unique: true },
    usuario:    { type: String, required: true, trim: true },
    dni:        { type: String, required: true, unique: true },
    nombre:     { type: String, required: true, trim: true },
    obraSocial: { type: String },
    plan:       { type: String },
});

export default model("Paciente", pacienteSchema);
