import { Schema, model } from "mongoose";
import { Paciente } from "../domain/Paciente.js";

// El plan del paciente guarda el porcentaje de cobertura general (0–100) que se
// copió del catálogo al crear la cuenta. La cobertura se calcula con este valor.
const planSchema = new Schema({
    nombre:           { type: String },
    coberturaGeneral: { type: Number },
}, { _id: false });

const pacienteSchema = new Schema({
    pacienteId: { type: Number, required: true, unique: true },
    usuario:    { type: String, required: true, trim: true },
    // select:false → el hash nunca viaja en las consultas/respuestas normales.
    // Para login se trae explícitamente con .select("+password").
    password:   { type: String, required: true, select: false },
    dni:        { type: String, required: true, unique: true },
    nombre:     { type: String, required: true, trim: true },
    obraSocial: { type: String },
    plan:       { type: planSchema },
    // Cuenta temporal de prueba, creada sin registro desde /demo.
    esDemo:     { type: Boolean, default: false },
    // Instante de vencimiento. Solo lo llevan las cuentas demo.
    expiraEn:   { type: Date, default: null },
}, { timestamps: true, id: false });
pacienteSchema.virtual('id').get(function() { return this.pacienteId; });
pacienteSchema.loadClass(Paciente);

// Barrido de cuentas demo vencidas. No se usa un índice TTL de Mongo a propósito:
// el TTL borraría el paciente pero dejaría sus turnos huérfanos ocupando agenda.
// La limpieza se hace en el service, que borra la cuenta Y sus turnos.
pacienteSchema.index({ esDemo: 1, expiraEn: 1 });

export default model("Paciente", pacienteSchema);
