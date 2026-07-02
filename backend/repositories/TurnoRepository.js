/*
    REPOSITORY — Acceso a datos para Turnos (MongoDB)

    Los turnos nunca se eliminan físicamente — solo cambian de estado.
    El historial de estados, las solicitudes de cambio y las propuestas
    del médico viajan embebidos en el documento del turno.
*/

import { ESTADOS } from "../domain/Turno.js";
import TurnoModel  from "../models/TurnoModel.js";
import ContadorModel from "../models/ContadorModel.js";

export class TurnoRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "turno" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    obtenerTodos() {
        return TurnoModel.find();
    }

    obtenerPorId(id) {
        return TurnoModel.findOne({ turnoId: id });
    }

    buscarPorMedico(medicoId) {
        return TurnoModel.find({ medicoId });
    }

    // Retorna los turnos activos de un médico para una fecha (excluye cancelados).
    buscarPorMedicoYFecha(medicoId, fecha) {
        return TurnoModel.find({
            medicoId,
            fecha,
            estado: { $ne: ESTADOS.CANCELADO },
        });
    }

    // Retorna todos los turnos del paciente (todos los estados, incluye historial completo).
    buscarPorPaciente(pacienteId) {
        return TurnoModel.find({ pacienteId });
    }

    buscarPorMedicoYPaciente(medicoId, pacienteId) {
        return TurnoModel.find({ medicoId, pacienteId });
    }

    crear(medicoId, pacienteId, fecha, hora, duracion, snapshotMedico, snapshotPaciente) {
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
                snapshotMedico,
                snapshotPaciente,
            }).save());
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
        );
    }
}
