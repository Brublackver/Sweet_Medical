import { Schema, model } from "mongoose";

// Subdocumentos embebidos — no tienen existencia fuera del médico
const especialidadSchema = new Schema({
    especId:             { type: Number, required: true },
    codigo:              { type: String, required: true },
    nombre:              { type: String, required: true },
    duracionTurnoEnMins: { type: Number, required: true },
    costo:               { type: Number, required: true },
});

const practicaSchema = new Schema({
    practicaId:          { type: Number, required: true },
    codigo:              { type: String, required: true },
    nombre:              { type: String, required: true },
    duracionTurnoEnMins: { type: Number, required: true },
    costo:               { type: Number, required: true },
});

const disponibilidadSchema = new Schema({
    disponibilidadId: { type: Number, required: true },
    fecha:            { type: String, required: true },
    horaDesde:        { type: String, required: true },
    horaHasta:        { type: String, required: true },
});

const sedeEmbebidaSchema = new Schema({
    sedeId:    { type: Number, required: true },
    nombre:    { type: String, required: true },
    direccion: { type: String, required: true },
}, { _id: false });

const medicoSchema = new Schema({
    medicoId:         { type: Number, required: true, unique: true },
    usuario:          { type: String, required: true, trim: true, maxlength: 30 },
    // select:false → el hash nunca viaja en las consultas/respuestas normales.
    password:         { type: String, required: true, select: false },
    matricula:        { type: String, required: true, trim: true, maxlength: 10 },
    nombre:           { type: String, required: true, trim: true, maxlength: 30 },
    especialidades:   [especialidadSchema],
    practicas:        [practicaSchema],
    disponibilidades: [disponibilidadSchema],
    sedes:            [sedeEmbebidaSchema],
}, { timestamps: true });

export default model("Medico", medicoSchema);
