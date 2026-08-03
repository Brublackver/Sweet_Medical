import { AvisoDisponibilidad, ESTADOS_AVISO } from "../../domain/AvisoDisponibilidad.js";

/*
    Fake en memoria del AvisoDisponibilidadRepository para tests unitarios.
    Respeta la regla de identidad: pacienteId + huella para los avisos ACTIVOS.
*/
export class FakeAvisoDisponibilidadRepository {
    constructor() {
        this._store  = new Map();
        this._nextId = 1;
    }

    crear(pacienteId, filtros) {
        const aviso = new AvisoDisponibilidad(this._nextId++, pacienteId, filtros);
        this._store.set(aviso.id, aviso);
        return Promise.resolve(aviso);
    }

    obtenerPorId(id) {
        return Promise.resolve(this._store.get(id) ?? null);
    }

    obtenerPorPaciente(pacienteId, estado) {
        return Promise.resolve(
            [...this._store.values()].filter((a) =>
                a.pacienteId === pacienteId && (estado === undefined || a.estado === estado)
            )
        );
    }

    buscarActivoPorHuella(pacienteId, huella) {
        return Promise.resolve(
            [...this._store.values()].find((a) =>
                a.pacienteId === pacienteId &&
                a.huella === huella &&
                a.estado === ESTADOS_AVISO.ACTIVO
            ) ?? null
        );
    }

    obtenerActivos() {
        return Promise.resolve(
            [...this._store.values()].filter((a) => a.estado === ESTADOS_AVISO.ACTIVO)
        );
    }

    actualizar(aviso) {
        this._store.set(aviso.id, aviso);
        return Promise.resolve(aviso);
    }
}
