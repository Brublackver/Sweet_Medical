import { Schema, model } from "mongoose";

const notificacionSchema = new Schema({
    notificacionId: { type: Number, required: true, unique: true },
    usuarioId:      { type: Number, required: true },
    tipo:           { type: String, required: true },
    mensaje:        { type: String, required: true },
    leida:          { type: Boolean, default: false },
    fechaCreacion:  { type: String },
}, { timestamps: true });

notificacionSchema.index({ usuarioId: 1, leida: 1 });

export default model("Notificacion", notificacionSchema);
