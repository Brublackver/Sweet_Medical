import { Schema, model } from "mongoose";

const sedeSchema = new Schema({
    nombre:    { type: String, required: true, trim: true },
    direccion: { type: String, required: true, trim: true },
});

export default model("Sede", sedeSchema);
