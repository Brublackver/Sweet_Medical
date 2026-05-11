import { Schema, model } from "mongoose";

const contadorSchema = new Schema({
    nombre: { type: String, required: true, unique: true },
    valor:  { type: Number, default: 0 },
});

export default model("Contador", contadorSchema);
