import { describe, it, expect } from "@jest/globals";
import { TurnoService } from "../services/TurnoService.js";
import { TurnoRepository } from "../repositories/TurnoRepository.js";
import { MedicoRepository } from "../repositories/MedicoRepository.js";
import { DisponibilidadHoraria } from "../domain/DisponibilidadHoraria.js";

describe("TurnoService - Alta de turno", () => {

    it("deberia crear un turno cuando el medico tiene disponibilidad", () => {
        const medicoRepository = new MedicoRepository();
        const turnoRepository = new TurnoRepository();
        const turnoService = new TurnoService({ turnoRepository, medicoRepository });

        return medicoRepository.crear({ usuario: "drhouse", matricula: "12345", nombre: "Gregory House" })
            .then((medico) => {
                const disponibilidad = new DisponibilidadHoraria("lunes", 9, 17);
                medico.definirDisponibilidad(disponibilidad);

                return turnoService.crearTurno({
                    medicoId: medico.id,
                    pacienteId: 1,
                    fecha: "2026-04-20",
                    hora: "10:00"
                });
            })
            .then((turno) => {
                expect(turno.medicoId).toBe(1);
                expect(turno.pacienteId).toBe(1);
                expect(turno.estado).toBe("reservado");
                expect(turno.fecha).toBe("2026-04-20");
                expect(turno.hora).toBe("10:00");
            });
    });
});
