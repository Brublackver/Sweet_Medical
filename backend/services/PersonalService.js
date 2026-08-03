/*
    SERVICE — Gestión del personal no médico (administración y limpieza)

    Alta, baja (lógica y física), modificación y consulta con filtros. La regla
    central es el documento único: es el legajo del empleado y no puede repetirse.
*/

import { NotFoundError, ConflictError } from "../errors/AppError.js";

export class PersonalService {
    constructor({ personalRepository } = {}) {
        this.personalRepository = personalRepository;
    }

    // filtros: { tipo?: string, activo?: boolean }
    obtenerTodos(filtros = {}) {
        return this.personalRepository.obtenerTodos(filtros);
    }

    obtenerPorId(id) {
        return this.personalRepository.obtenerPorId(id)
            .then((personal) => {
                if (!personal) return Promise.reject(new NotFoundError("Personal no encontrado"));
                return personal;
            });
    }

    crear(datos) {
        return this.personalRepository.existeDocumento(datos.documento)
            .then((existe) => {
                if (existe)
                    return Promise.reject(new ConflictError(
                        `Ya existe personal registrado con el documento "${datos.documento}"`
                    ));
                return this.personalRepository.crear(datos);
            });
    }

    // Edición parcial. Si viene un documento nuevo, se valida que no sea el de
    // otro empleado (excluyendo al propio, que obviamente puede conservarlo).
    actualizar(id, datos) {
        return this.obtenerPorId(id)
            .then((personal) => {
                if (datos.documento === undefined || datos.documento.trim() === personal.documento)
                    return personal;

                return this.personalRepository.existeDocumento(datos.documento, id)
                    .then((existe) => {
                        if (existe)
                            return Promise.reject(new ConflictError(
                                `Ya existe personal registrado con el documento "${datos.documento}"`
                            ));
                        return personal;
                    });
            })
            .then((personal) => {
                personal.actualizar(datos);
                return this.personalRepository.actualizar(personal);
            });
    }

    // Baja/alta lógica: el legajo se conserva, solo deja de estar operativo.
    cambiarEstado(id, activo) {
        return this.obtenerPorId(id)
            .then((personal) => {
                const cambiado = activo ? personal.activar() : personal.desactivar();
                if (!cambiado)
                    return Promise.reject(new ConflictError(
                        `El personal ya se encuentra ${activo ? "activo" : "inactivo"}`
                    ));
                return this.personalRepository.actualizar(personal);
            });
    }

    // Borrado FÍSICO. Existe para corregir cargas erróneas; para dar de baja a
    // alguien que trabajó acá se usa cambiarEstado(false) y se conserva el legajo.
    eliminar(id) {
        return this.obtenerPorId(id)
            .then(() => this.personalRepository.eliminar(id));
    }
}
