import { describe, it, expect }     from "@jest/globals";
import { MedicoService }            from "../services/MedicoService.js";
import { TurnoService }             from "../services/TurnoService.js";
import { FakeMedicoRepository }     from "./fakes/FakeMedicoRepository.js";
import { FakeTurnoRepository }      from "./fakes/FakeTurnoRepository.js";
import { ESTADOS }                  from "../domain/Turno.js";

const crearContexto = () => {
    const medicoRepository = new FakeMedicoRepository();
    const turnoRepository  = new FakeTurnoRepository();
    const medicoService    = new MedicoService({ medicoRepository });
    const turnoService     = new TurnoService({ turnoRepository, medicoService });
    medicoService.setTurnoService(turnoService);
    return { medicoRepository, turnoRepository, medicoService, turnoService };
};

const crearMedicoConDisponibilidad = (medicoRepository, config = {}) => {
    const { fecha = "2030-07-10", horaDesde = "09:00", horaHasta = "17:00" } = config;
    return medicoRepository
        .crear({ usuario: "drgomez", matricula: "54321", nombre: "Ana Gómez" })
        .then((medico) => {
            medico.definirDisponibilidad({ fecha, horaDesde, horaHasta });
            return medico;
        });
};

describe("MedicoService - Disponibilidad", () => {

    it("define la disponibilidad y la retorna correctamente", () => {
        const { medicoService } = crearContexto();

        return medicoService
            .crear({ usuario: "drgomez", matricula: "54321", nombre: "Ana Gómez" })
            .then((medico) =>
                medicoService.definirDisponibilidad(medico.id, {
                    fecha: "2030-07-10", horaDesde: "09:00", horaHasta: "17:00",
                }).then(() => medicoService.obtenerDisponibilidad(medico.id))
            )
            .then((disp) => {
                expect(disp["2030-07-10"]).toBeDefined();
                expect(disp["2030-07-10"].horaDesde).toBe("09:00");
                expect(disp["2030-07-10"].turnosReservados).toEqual([]);
            });
    });
});

describe("MedicoService - Cancelar turno", () => {

    it("cancela el turno con motivo y lo marca como CANCELADO", () => {
        const { medicoRepository, turnoService, medicoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 1,
                    fecha: "2030-07-10", hora: "10:00", duracion: 30,
                })
                .then((turno) => medicoService.cancelarTurno(medico.id, turno.id, "Médico no disponible"))
            )
            .then((turno) => {
                expect(turno.estado).toBe(ESTADOS.CANCELADO);
                expect(turno.historialEstados.at(-1).motivo).toBe("Médico no disponible");
            });
    });
});

describe("MedicoService - Proponer cambio de fecha", () => {

    it("pone el turno en PROPUESTA_MEDICO con la propuesta almacenada", () => {
        const { medicoRepository, turnoService, medicoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 1,
                    fecha: "2030-07-10", hora: "10:00", duracion: 30,
                })
                .then((turno) => medicoService.proponerCambioFecha(medico.id, turno.id, "2030-07-20", "11:00"))
            )
            .then((turno) => {
                expect(turno.estado).toBe(ESTADOS.PROPUESTA_MEDICO);
                expect(turno.propuestaMedicoFecha.nuevaFecha).toBe("2030-07-20");
                expect(turno.propuestaMedicoFecha.estado).toBe("pendiente");
            });
    });
});
