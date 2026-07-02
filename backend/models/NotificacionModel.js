import { Schema, model } from "mongoose";
import { Notificacion } from "../domain/Notificacion.js";

const notificacionSchema = new Schema({
    notificacionId: { type: Number, required: true, unique: true },
    usuarioTipo:    { type: String, required: true, enum: ["MEDICO", "PACIENTE"] },
    usuarioId:      { type: Number, required: true },
    tipo:           { type: String, required: true },
    mensaje:        { type: String, required: true },
    turnoId:        { type: Number }, // turno al que refiere (opcional); habilita accionar desde la campana
    leida:          { type: Boolean, default: false },
    resultado:      { type: String, default: null }, // "ACEPTADO" | "RECHAZADO" si fue resuelta
    fechaCreacion:  { type: String },
}, { timestamps: true, id: false });

notificacionSchema.virtual('id').get(function() { return this.notificacionId; });
notificacionSchema.loadClass(Notificacion);
notificacionSchema.index({ usuarioTipo: 1, usuarioId: 1, leida: 1 });

export default model("Notificacion", notificacionSchema);
