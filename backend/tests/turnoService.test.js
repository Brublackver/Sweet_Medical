import { describe, it, expect }     from "@jest/globals";
import { TurnoService }             from "../services/TurnoService.js";
import { MedicoService }            from "../services/MedicoService.js";
import { FakeTurnoRepository }      from "./fakes/FakeTurnoRepository.js";
import { FakeMedicoRepository }     from "./fakes/FakeMedicoRepository.js";
import { ESTADOS }                  from "../domain/Turno.js";

const crearContexto = () => {
    const medicoRepository = new FakeMedicoRepository();
    const turnoRepository  = new FakeTurnoRepository();
    const medicoService    = new MedicoService({ medicoRepository });
    const turnoService     = new TurnoService({ turnoRepository, medicoService });
    return { medicoRepository, turnoRepository, medicoService, turnoService };
};

const crearMedicoConDisponibilidad = (medicoRepository, config = {}) => {
    const { fecha = "2030-06-10", horaDesde = "09:00", horaHasta = "17:00" } = config;
    return medicoRepository
        .crear({ usuario: "drhouse", matricula: "12345", nombre: "Gregory House" })
        .then((medico) => {
            medico.definirDisponibilidad({ fecha, horaDesde, horaHasta });
            return medico;
        });
};

describe("TurnoService - Reserva de turno", () => {

    it("crea el turno cuando el médico tiene disponibilidad y no hay solapamiento", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) => turnoService.crearTurno({
                medicoId: medico.id, pacienteId: 1,
                fecha: "2030-06-10", hora: "10:00", duracion: 30,
            }))
            .then((turno) => {
                expect(turno.estado).toBe(ESTADOS.RESERVADO);
                expect(turno.fecha).toBe("2030-06-10");
                expect(turno.hora).toBe("10:00");
            });
    });

    it("rechaza si el médico no tiene disponibilidad en esa fecha", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) => turnoService.crearTurno({
                medicoId: medico.id, pacienteId: 1,
                fecha: "2030-06-11", hora: "10:00", duracion: 30,
            }))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/disponibilidad/i));
    });

    it("rechaza si el nuevo turno se superpone con uno existente", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 1,
                    fecha: "2030-06-10", hora: "10:00", duracion: 60,
                })
                .then(() => turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 2,
                    fecha: "2030-06-10", hora: "10:30", duracion: 30,
                }))
            )
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/superpone/i));
    });
});
