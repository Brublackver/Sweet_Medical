import { describe, it, expect } from "@jest/globals";
import { TurnoService } from "../services/TurnoService.js";
import { MedicoService } from "../services/MedicoService.js";
import { TurnoRepository } from "../repositories/TurnoRepository.js";
import { MedicoRepository } from "../repositories/MedicoRepository.js";

describe("TurnoService - Alta de turno", () => {
  it("deberia crear un turno cuando el medico tiene disponibilidad", () => {
    const medicoRepository = new MedicoRepository();
    const turnoRepository = new TurnoRepository();
    const medicoService = new MedicoService({ medicoRepository });
    const turnoService = new TurnoService({ turnoRepository, medicoService });

    return medicoRepository
      .crear({ usuario: "drhouse", matricula: "12345", nombre: "Gregory House" })
      .then((medico) => {
        medico.definirDisponibilidad({
          fecha: "2026-04-20",
          horaDesde: "09:00",
          horaHasta: "17:00",
        });

        return turnoService.crearTurno({
          medicoId: medico.id,
          fecha: "2026-04-20",
          hora: "10:00",
        });
      })
      .then((turno) => {
        expect(turno.medicoId).toBe(1);
        expect(turno.estado).toBe("reservado");
        expect(turno.fecha).toBe("2026-04-20");
        expect(turno.hora).toBe("10:00");
      });
  });
});
