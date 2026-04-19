/*
    REPOSITORY — Capa de acceso a datos para Turnos
    Almacena los turnos en memoria.
    Recibe pedidos del TurnoService y devuelve Promises.
*/

import { Turno } from "../domain/Turno.js";

export class TurnoRepository {
    constructor() {
        this.turnos = [];
        this.nextId = 1;
    }

    // Devuelve todos los turnos almacenados → Promise<Turno[]>
    // Viene de: TurnoService.obtenerTodos()
    // Va hacia: TurnoController como respuesta JSON
    obtenerTodos() {
        return Promise.resolve(this.turnos);
    }

    // Busca un turno por su id → Promise<Turno|null>
    // Recibe: id (number) desde TurnoService.cancelarTurno()
    // Va hacia: TurnoService para validar existencia antes de cancelar
    obtenerPorId(id) {
        const turno = this.turnos.find((t) => t.id === id) || null;
        return Promise.resolve(turno);
    }

    // Busca si ya existe un turno para un medico en una fecha/hora especifica → Promise<Turno|null>
    // Recibe: medicoId (number) y fechaHora (string ISO) desde TurnoService.crearTurno()
    // Va hacia: TurnoService para verificar que no haya turno duplicado
    buscarPorMedicoYFecha(medicoId, fechaHora) {
        const turno = this.turnos.find(
            (t) => t.medicoId === medicoId && t.fechaHora === fechaHora
        ) || null;
        return Promise.resolve(turno);
    }

    // Crea un nuevo turno con id autoincrementado → Promise<Turno>
    // Recibe: medicoId, pacienteId, fechaHora desde TurnoService.crearTurno()
    // Va hacia: TurnoService → TurnoController como respuesta 201
    crear(medicoId, pacienteId, fechaHora) {
        const nuevoTurno = new Turno(this.nextId++, medicoId, pacienteId, fechaHora);
        this.turnos.push(nuevoTurno);
        return Promise.resolve(nuevoTurno);
    }

    // Elimina un turno por su id → Promise<boolean>
    // Recibe: id (number) desde TurnoService.cancelarTurno()
    // Va hacia: TurnoService → TurnoController como respuesta 204
    eliminar(id) {
        const index = this.turnos.findIndex((t) => t.id === id);
        if (index === -1) return Promise.resolve(false);
        this.turnos.splice(index, 1);
        return Promise.resolve(true);
    }
}
