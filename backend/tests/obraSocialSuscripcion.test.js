import { describe, it, expect } from "@jest/globals";
import { ObraSocial, ESTADOS_SUSCRIPCION } from "../domain/ObraSocial.js";

/*
    La suscripción es lógica de DOMINIO pura (vigencia, activación, extensión por
    características). Se testea directo contra la entidad: no hace falta base ni
    repositorio para verificar la regla, y así el test no se ata a Mongoose.
*/

const crearObraSocial = () => new ObraSocial(1, "OSDE", [{ nombre: "210", coberturaGeneral: 25 }]);

describe("ObraSocial - suscripción", () => {

    it("una obra social recién creada no tiene suscripción ni es vigente", () => {
        const os = crearObraSocial();
        expect(os.tieneSuscripcion()).toBe(false);
        expect(os.suscripcionVigente()).toBe(false);
        expect(os.activa).toBe(true);
    });

    it("registrar una suscripción la deja ACTIVA y vigente por defecto", () => {
        const os = crearObraSocial();
        os.registrarSuscripcion({ modalidad: "PREMIUM" });

        expect(os.tieneSuscripcion()).toBe(true);
        expect(os.suscripcion.estado).toBe(ESTADOS_SUSCRIPCION.ACTIVA);
        expect(os.suscripcion.modalidad).toBe("PREMIUM");
        expect(os.suscripcionVigente()).toBe(true);
    });

    it("una suscripción vencida NO es vigente aunque esté ACTIVA", () => {
        const os = crearObraSocial();
        os.registrarSuscripcion({ fechaInicio: "2025-01-01", fechaVencimiento: "2025-12-31" });

        expect(os.suscripcion.estado).toBe(ESTADOS_SUSCRIPCION.ACTIVA);
        expect(os.suscripcionVigente("2026-08-03")).toBe(false);
        expect(os.suscripcionVigente("2025-06-15")).toBe(true);
        // El día del vencimiento todavía cuenta como vigente.
        expect(os.suscripcionVigente("2025-12-31")).toBe(true);
    });

    it("sin fecha de vencimiento el contrato no caduca", () => {
        const os = crearObraSocial();
        os.registrarSuscripcion({ fechaInicio: "2020-01-01" });
        expect(os.suscripcionVigente("2099-01-01")).toBe(true);
    });

    it("suspender la suscripción corta la vigencia; reactivarla la devuelve", () => {
        const os = crearObraSocial();
        os.registrarSuscripcion({});

        expect(os.desactivarSuscripcion()).toBe(true);
        expect(os.suscripcion.estado).toBe(ESTADOS_SUSCRIPCION.SUSPENDIDA);
        expect(os.suscripcionVigente()).toBe(false);

        expect(os.activarSuscripcion()).toBe(true);
        expect(os.suscripcionVigente()).toBe(true);
    });

    it("no se puede cambiar el estado de una suscripción que no existe", () => {
        const os = crearObraSocial();
        expect(os.activarSuscripcion()).toBe(false);
        expect(os.desactivarSuscripcion()).toBe(false);
    });

    it("actualizar la suscripción conserva la fecha de alta original", () => {
        const os = crearObraSocial();
        os.registrarSuscripcion({ fechaInicio: "2024-05-01", modalidad: "ESTANDAR" });
        os.registrarSuscripcion({ modalidad: "PREMIUM" });

        expect(os.suscripcion.fechaInicio).toBe("2024-05-01");
        expect(os.suscripcion.modalidad).toBe("PREMIUM");
    });

    it("las características son el punto de extensión: entran condiciones nuevas sin tocar el schema", () => {
        const os = crearObraSocial();
        os.registrarSuscripcion({
            caracteristicas: [
                { clave: "tope_mensual", valor: "150000" },
                { clave: "copago",       valor: "1500" },
            ],
        });

        expect(os.toJSON().suscripcion.caracteristicas).toHaveLength(2);
        expect(os.toJSON().suscripcion.caracteristicas[0].clave).toBe("tope_mensual");
    });

    it("dar de baja la obra social del catálogo es independiente de su suscripción", () => {
        const os = crearObraSocial();
        os.registrarSuscripcion({});
        os.desactivar();

        expect(os.activa).toBe(false);
        // El contrato sigue corriendo aunque la obra social salga del catálogo.
        expect(os.suscripcionVigente()).toBe(true);
    });

    it("toJSON expone la vigencia ya calculada y no rompe sin suscripción", () => {
        const os = crearObraSocial();
        const sinSuscripcion = os.toJSON();
        expect(sinSuscripcion.suscripcion).toBeNull();
        expect(sinSuscripcion.suscripcion_vigente).toBe(false);
        expect(sinSuscripcion.planes).toHaveLength(1);

        os.registrarSuscripcion({});
        expect(os.toJSON().suscripcion_vigente).toBe(true);
    });
});
