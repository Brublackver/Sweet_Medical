import { describe, it, expect } from "@jest/globals";
import { MedicoService } from "../services/MedicoService.js";
import { MedicoRepository } from "../repositories/MedicoRepository.js";
import { TurnoRepository } from "../repositories/TurnoRepository.js";

describe("MedicoService - Disponibilidad", () => {
  it("deberia definir la disponibilidad de un medico correctamente", () => {
    const medicoRepository = new MedicoRepository();
    const turnoRepository = new TurnoRepository();
    const medicoService = new MedicoService({
      medicoRepository,
      turnoRepository,
    });

    return medicoService
      .crear({
        usuario: "drhouse",
        matricula: "12345",
        nombre: "Gregory House",
      })
      .then((medico) => {
        return medicoService.definirDisponibilidad(medico.id, {
          diaSemana: "lunes",
          horaDesde: 9,
          horaHasta: 17,
        });
      })
      .then(() => {
        return medicoService.obtenerDisponibilidad(1);
      })
      .then((disponibilidad) => {
        expect(disponibilidad.lunes).toBeDefined();
        expect(disponibilidad.lunes.horaDesde).toBe(9);
        expect(disponibilidad.lunes.horaHasta).toBe(17);
        expect(disponibilidad.lunes.turnosReservados).toEqual([]);
      });
  });
});
