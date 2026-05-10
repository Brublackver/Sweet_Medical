import { Schema, model } from "mongoose";

// Subdocumentos embebidos — no tienen existencia fuera del médico
const especialidadSchema = new Schema({
    codigo:              { type: String, required: true },
    nombre:              { type: String, required: true },
    duracionTurnoEnMins: { type: Number, required: true },
    costo:               { type: Number, required: true },
});

const practicaSchema = new Schema({
    codigo:              { type: String, required: true },
    nombre:              { type: String, required: true },
    duracionTurnoEnMins: { type: Number, required: true },
    costo:               { type: Number, required: true },
});

const disponibilidadSchema = new Schema({
    fecha:     { type: String, required: true },
    horaDesde: { type: String, required: true },
    horaHasta: { type: String, required: true },
});

const medicoSchema = new Schema({
    usuario:          { type: String, required: true, trim: true },
    matricula:        { type: String, required: true, trim: true },
    nombre:           { type: String, required: true, trim: true },
    especialidades:   [especialidadSchema],
    practicas:        [practicaSchema],
    disponibilidades: [disponibilidadSchema],
    // Sedes referenciadas — una sede puede pertenecer a varios médicos
    sedes:            [{ type: Schema.Types.ObjectId, ref: "Sede" }],
});

export default model("Medico", medicoSchema);
