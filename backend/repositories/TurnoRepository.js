/*
    REPOSITORY — Capa de acceso a datos para Turnos

    ABSTRACCIÓN: el Service no sabe si los datos viven en memoria,
    MongoDB o cualquier otra fuente. Solo llama métodos del Repository.
    Cuando migremos a MongoDB, solo cambia esta clase.

    Los turnos NUNCA se eliminan físicamente — se marcan como cancelados.
    Esto preserva el historial y permite consultar el estado de cualquier turno.
*/

import { Turno } from "../domain/Turno.js";
import { ESTADOS } from "../domain/Turno.js";

export class TurnoRepository {
    constructor() {
        this.turnos = [];
        this.nextId = 1;
    }

    obtenerTodos() {
        return Promise.resolve(this.turnos);
    }

    obtenerPorId(id) {
        const turno = this.turnos.find((t) => t.id === id) || null;
        return Promise.resolve(turno);
    }

    buscarPorMedico(medicoId) {
        return Promise.resolve(
            this.turnos.filter((t) => t.medicoId === medicoId)
        );
    }

    // Retorna los turnos activos de un médico para una fecha.
    // IMPORTANTE: excluye cancelados — un slot cancelado queda libre
    // para que otro paciente pueda reservarlo.
    //
    // DECLARATIVIDAD: filter() encadena dos condiciones como dato,
    // no como dos if anidados.
    buscarPorMedicoYFecha(medicoId, fecha) {
        return Promise.resolve(
            this.turnos.filter(
                (t) => t.medicoId === medicoId
                    && t.fecha   === fecha
                    && t.estado  !== ESTADOS.CANCELADO
            )
        );
    }

    // Retorna todos los turnos de un paciente (todos los estados).
    // Usado para el historial personal — incluye cancelados y realizados.
    buscarPorPaciente(pacienteId) {
        return Promise.resolve(
            this.turnos.filter((t) => t.pacienteId === pacienteId)
        );
    }

    // Retorna los turnos de un paciente específico con un médico específico.
    // Usado por el médico para consultar el historial de un paciente suyo.
    buscarPorMedicoYPaciente(medicoId, pacienteId) {
        return Promise.resolve(
            this.turnos.filter(
                (t) => t.medicoId === medicoId && t.pacienteId === pacienteId
            )
        );
    }

    crear(medicoId, pacienteId, fecha, hora, duracion) {
        const nuevoTurno = new Turno(this.nextId++, medicoId, pacienteId, fecha, hora, duracion);
        this.turnos.push(nuevoTurno);
        return Promise.resolve(nuevoTurno);
    }

    // Persiste el estado actualizado de un turno existente.
    // En memoria, el objeto ya está mutado por referencia — esta función
    // es un contrato explícito para cuando migremos a MongoDB (update query).
    actualizar(turno) {
        const index = this.turnos.findIndex((t) => t.id === turno.id);
        if (index !== -1) this.turnos[index] = turno;
        return Promise.resolve(turno);
    }
}
