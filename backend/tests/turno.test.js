import { describe, it, expect } from "@jest/globals";
import { Turno, ESTADOS }       from "../domain/Turno.js";

const crearTurno = (overrides = {}) => new Turno(
    1,
    overrides.medicoId   ?? 1,
    overrides.pacienteId ?? 1,
    overrides.fecha      ?? "2030-01-15",
    overrides.hora       ?? "10:00",
    overrides.duracion   ?? 30,
);

describe("Turno - Cancelación", () => {

    it("cancelar() transiciona a CANCELADO y registra el motivo en el historial", () => {
        const turno = crearTurno();
        turno.cancelar("Paciente no asiste");
        expect(turno.estado).toBe(ESTADOS.CANCELADO);
        expect(turno.historialEstados).toHaveLength(2);
        expect(turno.historialEstados.at(-1).motivo).toBe("Paciente no asiste");
    });
});

describe("Turno - Solapamiento de slots", () => {

    it("seSuperponeConSlot() detecta solapamiento cuando los intervalos se cruzan", () => {
        const turno = crearTurno({ hora: "10:00", duracion: 60 }); // 10:00–11:00
        expect(turno.seSuperponeConSlot("10:30", 30)).toBe(true);  // 10:30–11:00
    });

    it("seSuperponeConSlot() permite turnos adyacentes sin solapamiento", () => {
        const turno = crearTurno({ hora: "10:00", duracion: 30 }); // 10:00–10:30
        expect(turno.seSuperponeConSlot("10:30", 30)).toBe(false); // 10:30–11:00
    });
});

describe("Turno - Solicitud de cambio de fecha", () => {

    it("solicitarCambioFecha() transiciona a PENDIENTE_CAMBIO y almacena la propuesta", () => {
        const turno = crearTurno();
        turno.solicitarCambioFecha("2030-02-01", "11:00");
        expect(turno.estado).toBe(ESTADOS.PENDIENTE_CAMBIO);
        expect(turno.solicitudCambioFecha.nuevaFecha).toBe("2030-02-01");
        expect(turno.solicitudCambioFecha.estado).toBe("pendiente");
    });
});

describe("Turno - Marcar realizado", () => {

    it("puedeMarcarseRealizado() retorna true para fecha pasada y false para futura", () => {
        const pasado = crearTurno({ fecha: "2020-01-01", hora: "10:00" });
        const futuro = crearTurno({ fecha: "2030-01-15", hora: "10:00" });
        expect(pasado.puedeMarcarseRealizado()).toBe(true);
        expect(futuro.puedeMarcarseRealizado()).toBe(false);
    });
});
