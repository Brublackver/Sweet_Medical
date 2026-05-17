/*
    REPOSITORY — Acceso a datos para Turnos (MongoDB)

    Los turnos nunca se eliminan físicamente — solo cambian de estado.
    El historial de estados, las solicitudes de cambio y las propuestas
    del médico viajan embebidos en el documento del turno.
*/

import { Turno, ESTADOS } from "../domain/Turno.js";
import TurnoModel         from "../models/TurnoModel.js";
import ContadorModel      from "../models/ContadorModel.js";

export class TurnoRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "turno" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    obtenerTodos() {
        return TurnoModel.find().lean()
            .then((docs) => docs.map(this._toTurno));
    }

    obtenerPorId(id) {
        return TurnoModel.findOne({ turnoId: id }).lean()
            .then((doc) => doc ? this._toTurno(doc) : null);
    }

    buscarPorMedico(medicoId) {
        return TurnoModel.find({ medicoId }).lean()
            .then((docs) => docs.map(this._toTurno));
    }

    // Retorna los turnos activos de un médico para una fecha (excluye cancelados).
    buscarPorMedicoYFecha(medicoId, fecha) {
        return TurnoModel.find({
            medicoId,
            fecha,
            estado: { $ne: ESTADOS.CANCELADO },
        }).lean()
            .then((docs) => docs.map(this._toTurno));
    }

    // Retorna todos los turnos del paciente (todos los estados, incluye historial completo).
    buscarPorPaciente(pacienteId) {
        return TurnoModel.find({ pacienteId }).lean()
            .then((docs) => docs.map(this._toTurno));
    }

    buscarPorMedicoYPaciente(medicoId, pacienteId) {
        return TurnoModel.find({ medicoId, pacienteId }).lean()
            .then((docs) => docs.map(this._toTurno));
    }

    crear(medicoId, pacienteId, fecha, hora, duracion) {
        const ahora = new Date().toISOString();
        return this._siguienteId()
            .then((turnoId) => new TurnoModel({
                turnoId,
                medicoId,
                pacienteId,
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
            }).save())
            .then((doc) => this._toTurno(doc.toObject()));
    }

    // Persiste el estado actualizado del turno en MongoDB.
    actualizar(turno) {
        return TurnoModel.findOneAndUpdate(
            { turnoId: turno.id },
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

    _toTurno(doc) {
        const turno = new Turno(
            doc.turnoId,
            doc.medicoId,
            doc.pacienteId,
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
