/*
    SERVICE — Gestión del catálogo de sedes

    Las sedes son un catálogo del sistema (no las crea cada médico).
    Un médico se asigna a sedes existentes; no puede inventar las suyas.
*/

import { ConflictError } from "../errors/AppError.js";

export class SedeService {
    constructor({ sedeRepository } = {}) {
        this.sedeRepository = sedeRepository;
    }

    obtenerTodas() {
        return this.sedeRepository.obtenerTodos();
    }

    obtenerPorId(id) {
        return this.sedeRepository.obtenerPorId(id);
    }

    crear(datos) {
        return this.sedeRepository.existeNombre(datos.nombre)
            .then((existe) => {
                if (existe)
                    return Promise.reject(new ConflictError(
                        `Ya existe una sede con el nombre "${datos.nombre}"`
                    ));
                return this.sedeRepository.crear(datos);
            });
    }
}
