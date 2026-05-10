/*
    REPOSITORY — Acceso a datos para Turnos (MongoDB)

    Los turnos nunca se eliminan físicamente — solo cambian de estado.
    El historial de estados, las solicitudes de cambio y las propuestas
    del médico viajan embebidos en el documento del turno.

    _toTurno: reconstruye la instancia de dominio Turno desde MongoDB,
    sobreescribiendo el estado inicial del constructor con los datos reales.
*/

import mongoose       from "mongoose";
import { Turno, ESTADOS } from "../domain/Turno.js";
import TurnoModel     from "../models/TurnoModel.js";

export class TurnoRepository {

    obtenerTodos() {
        return TurnoModel.find().lean()
            .then((docs) => docs.map(this._toTurno));
    }

    obtenerPorId(id) {
        return TurnoModel.findById(id).lean()
            .then((doc) => doc ? this._toTurno(doc) : null);
    }

    buscarPorMedico(medicoId) {
        return TurnoModel.find({ medicoId: new mongoose.Types.ObjectId(medicoId) }).lean()
            .then((docs) => docs.map(this._toTurno));
    }

    // Retorna los turnos activos de un médico para una fecha (excluye cancelados).
    buscarPorMedicoYFecha(medicoId, fecha) {
        return TurnoModel.find({
            medicoId: new mongoose.Types.ObjectId(medicoId),
            fecha,
            estado: { $ne: ESTADOS.CANCELADO },
        }).lean()
            .then((docs) => docs.map(this._toTurno));
    }

    // Retorna todos los turnos del paciente (todos los estados, incluye historial completo).
    buscarPorPaciente(pacienteId) {
        return TurnoModel.find({ pacienteId: new mongoose.Types.ObjectId(pacienteId) }).lean()
            .then((docs) => docs.map(this._toTurno));
    }

    buscarPorMedicoYPaciente(medicoId, pacienteId) {
        return TurnoModel.find({
            medicoId:   new mongoose.Types.ObjectId(medicoId),
            pacienteId: new mongoose.Types.ObjectId(pacienteId),
        }).lean()
            .then((docs) => docs.map(this._toTurno));
    }

    crear(medicoId, pacienteId, fecha, hora, duracion) {
        const ahora = new Date().toISOString();
        return new TurnoModel({
            medicoId:   new mongoose.Types.ObjectId(medicoId),
            pacienteId: new mongoose.Types.ObjectId(pacienteId),
            fecha,
            hora,
            duracion,
            estado:        ESTADOS.RESERVADO,
            fechaCreacion: ahora,
            historialEstados: [{
                fechaHora: ahora,
                estado:    ESTADOS.RESERVADO,
                motivo:    null,
            }],
        }).save()
            .then((doc) => this._toTurno(doc.toObject()));
    }

    // Persiste el estado actualizado del turno en MongoDB.
    actualizar(turno) {
        return TurnoModel.findByIdAndUpdate(
            turno.id,
            {
                estado:               turno.estado,
                fecha:                turno.fecha,
                hora:                 turno.hora,
                historialEstados:     turno.historialEstados,
                solicitudCambioFecha: turno.solicitudCambioFecha,
                propuestaMedicoFecha: turno.propuestaMedicoFecha,
            },
            { new: true }
        ).lean()
            .then((doc) => this._toTurno(doc));
    }

    // Reconstruye la instancia de dominio Turno desde el documento MongoDB.
    // Sobreescribe el estado inicial del constructor con los datos reales de la BD.
    _toTurno(doc) {
        const turno = new Turno(
            doc._id.toString(),
            doc.medicoId.toString(),
            doc.pacienteId.toString(),
            doc.fecha,
            doc.hora,
            doc.duracion,
        );
        turno.estado               = doc.estado;
        turno.historialEstados     = doc.historialEstados     || [];
        turno.solicitudCambioFecha = doc.solicitudCambioFecha || null;
        turno.propuestaMedicoFecha = doc.propuestaMedicoFecha || null;
        turno.fechaCreacion        = doc.fechaCreacion        || turno.fechaCreacion;
        return turno;
    }
}
