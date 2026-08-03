import { Schema, model } from "mongoose";
import { Personal, TIPOS_PERSONAL } from "../domain/Personal.js";

/*
    Colección PROPIA, separada de medicos y pacientes. El personal no médico no
    comparte identidad ni credenciales con ellos: no se loguea, no tiene agenda
    y no reserva turnos. Su id vive en su propio contador ("personal").
*/
const personalSchema = new Schema({
    personalId:    { type: Number, required: true, unique: true },
    nombre:        { type: String, required: true, trim: true },
    apellido:      { type: String, required: true, trim: true },
    // Documento/legajo: identificador del empleado. Único en la colección.
    documento:     { type: String, required: true, unique: true, trim: true },
    telefono:      { type: String, default: null, trim: true },
    email:         { type: String, default: null, trim: true, lowercase: true },
    // Extensible: sumar un tipo nuevo es agregarlo a TIPOS_PERSONAL y nada más.
    tipo:          { type: String, required: true, enum: Object.values(TIPOS_PERSONAL) },
    sede:          { type: String, default: null, trim: true },
    observaciones: { type: String, default: null, trim: true },
    activo:        { type: Boolean, default: true },
    fechaAlta:     { type: String },
    fechaBaja:     { type: String, default: null },
}, { timestamps: true, id: false });

personalSchema.virtual('id').get(function() { return this.personalId; });
personalSchema.loadClass(Personal);

// Los dos filtros que pide la pantalla de gestión: por tipo y por estado.
personalSchema.index({ tipo: 1, activo: 1 });

export default model("Personal", personalSchema);
