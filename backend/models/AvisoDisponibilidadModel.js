import { Schema, model } from "mongoose";
import { AvisoDisponibilidad, ESTADOS_AVISO } from "../domain/AvisoDisponibilidad.js";

// Filtros embebidos: la foto exacta de la búsqueda que no dio resultados.
const filtrosSchema = new Schema({
    medicoId:     { type: Number, default: null },
    especialidad: { type: String, default: null, trim: true },
    practica:     { type: String, default: null, trim: true },
    sede:         { type: String, default: null, trim: true },
    obraSocial:   { type: String, default: null, trim: true },
    fechaDesde:   { type: String, default: null },
    fechaHasta:   { type: String, default: null },
}, { _id: false });

const avisoDisponibilidadSchema = new Schema({
    avisoId:       { type: Number, required: true, unique: true },
    pacienteId:    { type: Number, required: true },
    filtros:       { type: filtrosSchema, default: () => ({}) },
    // Firma de los filtros: junto con pacienteId identifica la suscripción.
    huella:        { type: String, required: true },
    estado:        { type: String, required: true, enum: Object.values(ESTADOS_AVISO), default: ESTADOS_AVISO.ACTIVO },
    fechaCreacion: { type: String },
    fechaAviso:    { type: String, default: null },
}, { timestamps: true, id: false });

avisoDisponibilidadSchema.virtual('id').get(function() { return this.avisoId; });
avisoDisponibilidadSchema.loadClass(AvisoDisponibilidad);

// Un paciente no puede tener DOS avisos activos con los mismos filtros.
// El índice parcial deja libres los cancelados/notificados: si el paciente
// vuelve a pedir el mismo aviso más adelante, puede.
avisoDisponibilidadSchema.index(
    { pacienteId: 1, huella: 1 },
    { unique: true, partialFilterExpression: { estado: ESTADOS_AVISO.ACTIVO } }
);
avisoDisponibilidadSchema.index({ estado: 1 });

export default model("AvisoDisponibilidad", avisoDisponibilidadSchema);
