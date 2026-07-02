import { describe, it, expect } from "@jest/globals";
import {
    buildAppointmentDateTime,
    isAppointmentExpired,
    isAppointmentBookable,
    fechaHoyISO,
} from "../domain/tiempo.js";

describe("tiempo - buildAppointmentDateTime", () => {

    // El corazón del bug: la fecha/hora se interpreta en hora de Argentina (UTC-3),
    // no en la zona horaria del proceso. Esta aserción es independiente de la TZ del
    // server (en Railway es UTC), porque compara el instante absoluto en UTC.
    it("interpreta fecha+hora en hora de Argentina (UTC-03:00)", () => {
        const instante = buildAppointmentDateTime("2026-07-01", "14:00");
        expect(instante.toISOString()).toBe("2026-07-01T17:00:00.000Z");
    });

    it("retorna Invalid Date ante una hora inválida", () => {
        expect(Number.isNaN(buildAppointmentDateTime("2026-07-01", "99:99").getTime())).toBe(true);
    });
});

describe("tiempo - isAppointmentExpired / isAppointmentBookable", () => {

    // Escenario real del bug: paciente en Argentina a las 12:00 ART (15:00 UTC),
    // turno para las 14:00 ART (2 horas en el futuro). Antes del fix, un server en
    // UTC lo marcaba como pasado. Ahora debe seguir siendo reservable.
    const ahora = new Date("2026-07-01T15:00:00Z"); // 12:00 ART

    it("un turno ~2 horas en el futuro NO está vencido", () => {
        expect(isAppointmentExpired("2026-07-01", "14:00", ahora)).toBe(false);
        expect(isAppointmentBookable("2026-07-01", "14:00", ahora)).toBe(true);
    });

    it("un turno de hoy cuyo horario ya pasó SÍ está vencido", () => {
        expect(isAppointmentExpired("2026-07-01", "10:00", ahora)).toBe(true);
        expect(isAppointmentBookable("2026-07-01", "10:00", ahora)).toBe(false);
    });

    it("un turno exactamente en 'ahora' se considera vencido (no reservable)", () => {
        // 12:00 ART == 15:00 UTC == ahora
        expect(isAppointmentBookable("2026-07-01", "12:00", ahora)).toBe(false);
    });
});

describe("tiempo - fechaHoyISO", () => {

    it("devuelve el día en formato YYYY-MM-DD", () => {
        expect(fechaHoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
