/*
    DOMAIN — Catálogo de Obras Sociales

    Una obra social es un dato maestro del sistema: tiene un nombre y una lista
    de planes. Cada plan define UN porcentaje de cobertura general (0–100) que
    aplica a todos los servicios. El paciente NO inventa su cobertura: elige una
    obra social y un plan del catálogo, y la cobertura sale de ahí.

    Regla de negocio (vive en el cálculo, no en el dato): un plan con 0% igual
    bonifica un 10% en las prácticas.
*/
export class ObraSocial {
    constructor(id, nombre, planes = []) {
        this.id     = id;
        this.nombre = nombre;
        this.planes = planes;
    }

    toJSON() {
        return {
            obra_social_id: this.id,
            nombre:         this.nombre,
            planes: (this.planes || []).map((p) => ({
                nombre:           p.nombre,
                coberturaGeneral: p.coberturaGeneral,
            })),
        };
    }
}
