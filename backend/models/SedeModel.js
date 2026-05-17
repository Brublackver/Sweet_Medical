import { Schema, model } from "mongoose";

const sedeSchema = new Schema({
    sedeId:    { type: Number, required: true, unique: true },
    nombre:    { type: String, required: true, trim: true },
    direccion: { type: String, required: true, trim: true },
}, { timestamps: true });

export default model("Sede", sedeSchema);
