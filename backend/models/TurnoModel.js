import { Schema, model } from "mongoose";
import { ESTADOS } from "../domain/Turno.js";

// Registro inmutable de cada transición de estado
const cambioEstadoSchema = new Schema({
    fechaHora: String,
    estado:    String,
    motivo:    String,
}, { _id: false });

// Propuesta de cambio de fecha (usada tanto por paciente como por médico)
const propuestaCambioSchema = new Schema({
    nuevaFecha:   String,
    nuevaHora:    String,
    estado:       String,
    solicitadoEn: String,
    propuestoEn:  String,
}, { _id: false });

// Snapshots — imagen inmutable del médico y paciente al momento de crear el turno
const snapshotServicioSchema = new Schema({
    codigo:              { type: String },
    nombre:              { type: String },
    duracionTurnoEnMins: { type: Number },
    costo:               { type: Number },
}, { _id: false });

const snapshotMedicoSchema = new Schema({
    medicoId:       { type: Number },
    nombre:         { type: String },
    matricula:      { type: String },
    especialidades: [snapshotServicioSchema],
    practicas:      [snapshotServicioSchema],
}, { _id: false });

const snapshotCoberturaSchema = new Schema({
    codigo: { type: String },
    nivel:  { type: Number },
}, { _id: false });

const snapshotPlanSchema = new Schema({
    nombre:                 { type: String },
    coberturasEspecialidad: [snapshotCoberturaSchema],
    coberturasPractica:     [snapshotCoberturaSchema],
}, { _id: false });

const snapshotPacienteSchema = new Schema({
    pacienteId: { type: Number },
    nombre:     { type: String },
    dni:        { type: String },
    obraSocial: { type: String },
    plan:       { type: snapshotPlanSchema, default: null },
}, { _id: false });

const turnoSchema = new Schema({
    turnoId:    { type: Number, required: true, unique: true },
    medicoId:   { type: Number, required: true },
    pacienteId: { type: Number, required: true },

    fecha:    { type: String, required: true },
    hora:     { type: String, required: true },
    duracion: { type: Number, required: true },

    estado: {
        type:    String,
        enum:    Object.values(ESTADOS),
        default: ESTADOS.RESERVADO,
    },

    fechaCreacion:        { type: String },
    historialEstados:     [cambioEstadoSchema],
    solicitudCambioFecha: { type: propuestaCambioSchema, default: null },
    propuestaMedicoFecha: { type: propuestaCambioSchema, default: null },

    snapshotMedico:   { type: snapshotMedicoSchema,   default: null },
    snapshotPaciente: { type: snapshotPacienteSchema, default: null },
}, { timestamps: true });

// Índices para mejorar las búsquedas más frecuentes
turnoSchema.index({ medicoId: 1, fecha: 1 });
turnoSchema.index({ pacienteId: 1 });

export default model("Turno", turnoSchema);
