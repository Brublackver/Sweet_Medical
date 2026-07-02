import { Schema, model } from "mongoose";
import { Sede } from "../domain/Sede.js";

const sedeSchema = new Schema({
    sedeId:    { type: Number, required: true, unique: true },
    nombre:    { type: String, required: true, trim: true },
    direccion: { type: String, required: true, trim: true },
}, { timestamps: true, id: false });

sedeSchema.virtual('id').get(function() { return this.sedeId; });
sedeSchema.loadClass(Sede);

export default model("Sede", sedeSchema);
