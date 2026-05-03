import { describe, it, expect } from "@jest/globals";
import { MedicoService } from "../services/MedicoService.js";
import { MedicoRepository } from "../repositories/MedicoRepository.js";

describe("MedicoService - Disponibilidad", () => {
  it("deberia definir la disponibilidad de un medico correctamente", () => {
    const medicoRepository = new MedicoRepository();
    const turnoService = { buscarPorMedico: () => Promise.resolve([]) };
    const medicoService = new MedicoService({ medicoRepository, turnoService });

    return medicoService
      .crear({ usuario: "drhouse", matricula: "12345", nombre: "Gregory House" })
      .then((medico) => {
        return medicoService.definirDisponibilidad(medico.id, {
          fecha: "2026-06-02",
          horaDesde: "09:00",
          horaHasta: "17:00",
        });
      })
      .then(() => medicoService.obtenerDisponibilidad(1))
      .then((disponibilidad) => {
        expect(disponibilidad["2026-06-02"]).toBeDefined();
        expect(disponibilidad["2026-06-02"].horaDesde).toBe("09:00");
        expect(disponibilidad["2026-06-02"].horaHasta).toBe("17:00");
        expect(disponibilidad["2026-06-02"].turnosReservados).toEqual([]);
      });
  });
});
