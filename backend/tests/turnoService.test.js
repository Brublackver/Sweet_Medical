import { describe, it } from "node:test";
import assert from "node:assert";
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
                assert.strictEqual(turno.medicoId, 1);
                assert.strictEqual(turno.pacienteId, 1);
                assert.strictEqual(turno.estado, "reservado");
                assert.strictEqual(turno.fecha, "2026-04-20");
                assert.strictEqual(turno.hora, "10:00");
            });
    });
});
