/*
    SERVICE — Catálogo y suscripciones de Obras Sociales

    Las obras sociales son un catálogo del sistema (datos maestros). El paciente
    elige una y un plan; no las inventa. Lo que SÍ se administra desde la app es
    el vínculo comercial: alta de la obra social, su suscripción y el estado de
    ambas. Los planes siguen viniendo del código (ver ObraSocialRepository).
*/

import { NotFoundError, ConflictError } from "../errors/AppError.js";

export class ObraSocialService {
    constructor({ obraSocialRepository } = {}) {
        this.obraSocialRepository = obraSocialRepository;
    }

    // filtros: { activa?: boolean, vigente?: boolean }
    obtenerTodas(filtros = {}) {
        return this.obraSocialRepository.obtenerTodos(filtros);
    }

    obtenerPorId(id) {
        return this.obraSocialRepository.obtenerPorId(id)
            .then((obraSocial) => {
                if (!obraSocial) return Promise.reject(new NotFoundError("Obra social no encontrada"));
                return obraSocial;
            });
    }

    // Alta de una obra social. El nombre es su identidad de negocio, así que no
    // se permiten duplicados (misma regla que las sedes).
    crear(datos) {
        return this.obraSocialRepository.existeNombre(datos.nombre)
            .then((existe) => {
                if (existe)
                    return Promise.reject(new ConflictError(
                        `Ya existe una obra social con el nombre "${datos.nombre}"`
                    ));
                return this.obraSocialRepository.crear(datos);
            });
    }

    // --- Suscripción ---------------------------------------------------------

    // Alta o actualización de la suscripción. Idempotente: volver a llamarlo con
    // datos nuevos actualiza el contrato sin perder la fecha de alta original.
    registrarSuscripcion(id, datos) {
        return this.obtenerPorId(id)
            .then((obraSocial) => {
                obraSocial.registrarSuscripcion(datos);
                return this.obraSocialRepository.actualizar(obraSocial);
            });
    }

    // activa = true → ACTIVA | false → SUSPENDIDA
    cambiarEstadoSuscripcion(id, activa) {
        return this.obtenerPorId(id)
            .then((obraSocial) => {
                const cambiado = activa
                    ? obraSocial.activarSuscripcion()
                    : obraSocial.desactivarSuscripcion();

                if (!cambiado)
                    return Promise.reject(new ConflictError(
                        "La obra social no tiene una suscripción registrada"
                    ));

                return this.obraSocialRepository.actualizar(obraSocial);
            });
    }

    // Estado consolidado: sirve para responder "¿le puedo facturar a esta obra
    // social?" sin que el cliente tenga que combinar los flags a mano.
    consultarEstado(id) {
        return this.obtenerPorId(id)
            .then((obraSocial) => ({
                obra_social_id:      obraSocial.id,
                nombre:              obraSocial.nombre,
                activa:              obraSocial.activa !== false,
                tiene_suscripcion:   obraSocial.tieneSuscripcion(),
                suscripcion_vigente: obraSocial.suscripcionVigente(),
                suscripcion:         obraSocial.toJSON().suscripcion,
            }));
    }

    // --- Estado de la obra social -------------------------------------------

    cambiarEstado(id, activa) {
        return this.obtenerPorId(id)
            .then((obraSocial) => {
                if (activa) obraSocial.activar();
                else        obraSocial.desactivar();
                return this.obraSocialRepository.actualizar(obraSocial);
            });
    }
}
