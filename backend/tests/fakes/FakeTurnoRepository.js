import { Turno, ESTADOS } from "../../domain/Turno.js";

/*
    Fake en memoria del TurnoRepository para tests unitarios.
    No coerciona tipos: si el test pasa pacienteId: 1 (int),
    se almacena y compara como int — consistente con el contexto de test.
*/
export class FakeTurnoRepository {
    constructor() {
        this._store  = new Map();
        this._nextId = 1;
    }

    crear(medicoId, pacienteId, fecha, hora, duracion) {
        const turno = new Turno(this._nextId++, medicoId, pacienteId, fecha, hora, duracion);
        this._store.set(turno.id, turno);
        return Promise.resolve(turno);
    }

    obtenerPorId(id) {
        return Promise.resolve(this._store.get(id) ?? null);
    }

    obtenerTodos() {
        return Promise.resolve([...this._store.values()]);
    }

    buscarPorMedico(medicoId) {
        return Promise.resolve(
            [...this._store.values()].filter((t) => t.medicoId === medicoId)
        );
    }

    // Excluye cancelados — replica la lógica del repositorio real.
    buscarPorMedicoYFecha(medicoId, fecha) {
        return Promise.resolve(
            [...this._store.values()].filter(
                (t) => t.medicoId === medicoId && t.fecha === fecha && t.estado !== ESTADOS.CANCELADO
            )
        );
    }

    buscarPorPaciente(pacienteId) {
        return Promise.resolve(
            [...this._store.values()].filter((t) => t.pacienteId === pacienteId)
        );
    }

    buscarPorMedicoYPaciente(medicoId, pacienteId) {
        return Promise.resolve(
            [...this._store.values()].filter(
                (t) => t.medicoId === medicoId && t.pacienteId === pacienteId
            )
        );
    }

    actualizar(turno) {
        this._store.set(turno.id, turno);
        return Promise.resolve(turno);
    }
}
