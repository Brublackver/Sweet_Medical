/*
    DOMAIN — Catálogo de Obras Sociales

    Una obra social es un dato maestro del sistema: tiene un nombre y una lista
    de planes. Cada plan define UN porcentaje de cobertura general (0–100) que
    aplica a todos los servicios. El paciente NO inventa su cobertura: elige una
    obra social y un plan del catálogo, y la cobertura sale de ahí.

    Regla de negocio (vive en el cálculo, no en el dato): un plan con 0% igual
    bonifica un 10% en las prácticas.

    SUSCRIPCIÓN — el vínculo comercial entre la clínica y la obra social.
    Ojo con no confundir tres cosas que son distintas:

      · PLAN (110, Gold, ...)  → qué cubre la obra social al PACIENTE.
      · SUSCRIPCIÓN            → el contrato de la OBRA SOCIAL con la clínica:
                                 desde cuándo, hasta cuándo, en qué modalidad.
      · activa (obra social)   → si la obra social sigue siendo parte del catálogo.

    Una obra social puede estar activa y con la suscripción vencida (deja de ser
    vigente), o de baja del catálogo aunque el contrato siga corriendo. Por eso
    son dos flags separados y no uno solo.

    La suscripción se modela como una entidad embebida con una lista abierta de
    `caracteristicas` ({ clave, valor }). Ese es el punto de extensión: mañana se
    agregan topes, copagos, condiciones o modalidades nuevas SIN tocar el schema.
*/

export const ESTADOS_SUSCRIPCION = Object.freeze({
    ACTIVA:     "ACTIVA",
    SUSPENDIDA: "SUSPENDIDA",
});

export class ObraSocial {
    constructor(id, nombre, planes = [], suscripcion = null, activa = true) {
        this.id          = id;
        this.nombre      = nombre;
        this.planes      = planes;
        this.suscripcion = suscripcion;
        this.activa      = activa;
    }

    // --- Estado de la obra social -------------------------------------------

    activar() {
        this.activa = true;
        return this;
    }

    desactivar() {
        this.activa = false;
        return this;
    }

    // --- Suscripción ---------------------------------------------------------

    // Alta o reemplazo de la suscripción. Si ya existía, se conserva la fecha de
    // alta original: cambiar las condiciones no debería borrar desde cuándo es
    // cliente la obra social.
    registrarSuscripcion(datos = {}) {
        const previa = this.suscripcion;
        this.suscripcion = {
            modalidad:       datos.modalidad ?? previa?.modalidad ?? "ESTANDAR",
            estado:          datos.estado    ?? previa?.estado    ?? ESTADOS_SUSCRIPCION.ACTIVA,
            fechaInicio:     datos.fechaInicio     ?? previa?.fechaInicio ?? new Date().toISOString().split("T")[0],
            fechaVencimiento: datos.fechaVencimiento ?? null,
            contacto:        datos.contacto     ?? previa?.contacto     ?? null,
            observaciones:   datos.observaciones ?? previa?.observaciones ?? null,
            // Punto de extensión: pares clave/valor libres para condiciones futuras.
            caracteristicas: datos.caracteristicas ?? previa?.caracteristicas ?? [],
        };
        return this.suscripcion;
    }

    // Retorna false si no hay suscripción que activar/desactivar.
    cambiarEstadoSuscripcion(estado) {
        if (!this.suscripcion) return false;
        this.suscripcion.estado = estado;
        return true;
    }

    activarSuscripcion() {
        return this.cambiarEstadoSuscripcion(ESTADOS_SUSCRIPCION.ACTIVA);
    }

    desactivarSuscripcion() {
        return this.cambiarEstadoSuscripcion(ESTADOS_SUSCRIPCION.SUSPENDIDA);
    }

    tieneSuscripcion() {
        return this.suscripcion != null;
    }

    // Vigente = hay suscripción, está ACTIVA y no venció.
    // Sin fechaVencimiento se interpreta como contrato sin fecha de corte.
    // Las fechas son "YYYY-MM-DD": el orden lexicográfico es el cronológico.
    suscripcionVigente(hoy = new Date().toISOString().split("T")[0]) {
        if (!this.suscripcion) return false;
        if (this.suscripcion.estado !== ESTADOS_SUSCRIPCION.ACTIVA) return false;
        if (!this.suscripcion.fechaVencimiento) return true;
        return this.suscripcion.fechaVencimiento >= hoy;
    }

    _suscripcionJSON() {
        if (!this.suscripcion) return null;
        return {
            modalidad:        this.suscripcion.modalidad,
            estado:           this.suscripcion.estado,
            fechaInicio:      this.suscripcion.fechaInicio      ?? null,
            fechaVencimiento: this.suscripcion.fechaVencimiento ?? null,
            contacto:         this.suscripcion.contacto         ?? null,
            observaciones:    this.suscripcion.observaciones    ?? null,
            caracteristicas: (this.suscripcion.caracteristicas || []).map((c) => ({
                clave: c.clave, valor: c.valor,
            })),
        };
    }

    toJSON() {
        return {
            obra_social_id: this.id,
            nombre:         this.nombre,
            planes: (this.planes || []).map((p) => ({
                nombre:           p.nombre,
                coberturaGeneral: p.coberturaGeneral,
            })),
            activa:      this.activa !== false,
            suscripcion: this._suscripcionJSON(),
            // Derivado, no persistido: le ahorra al cliente reimplementar la regla.
            suscripcion_vigente: this.suscripcionVigente(),
        };
    }
}
