import { describe, it, expect }         from "@jest/globals";
import { TurnoService }                 from "../services/TurnoService.js";
import { MedicoService }                from "../services/MedicoService.js";
import { FakeTurnoRepository }          from "./fakes/FakeTurnoRepository.js";
import { FakeMedicoRepository }         from "./fakes/FakeMedicoRepository.js";
import { ESTADOS }                      from "../domain/Turno.js";

// INVERSIÓN DE DEPENDENCIAS: el Service recibe sus dependencias desde afuera.
// El test controla el estado inicial sin tocar la implementación.
const crearContexto = () => {
    const medicoRepository = new FakeMedicoRepository();
    const turnoRepository  = new FakeTurnoRepository();
    const medicoService    = new MedicoService({ medicoRepository });
    const turnoService     = new TurnoService({ turnoRepository, medicoService });
    return { medicoRepository, turnoRepository, medicoService, turnoService };
};

const crearMedicoConDisponibilidad = (medicoRepository, { fecha, horaDesde, horaHasta }) =>
    medicoRepository
        .crear({ usuario: "drhouse", matricula: "12345", nombre: "Gregory House" })
        .then((medico) => {
            medico.definirDisponibilidad({ fecha, horaDesde, horaHasta });
            return medico;
        });

describe("TurnoService - Reserva de turno", () => {

    it("crea el turno cuando el médico tiene disponibilidad y no hay solapamiento", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-06-10", horaDesde: "09:00", horaHasta: "17:00",
        })
        .then((medico) => turnoService.crearTurno({
            medicoId: medico.id, pacienteId: 1,
            fecha: "2030-06-10", hora: "10:00", duracion: 30,
        }))
        .then((turno) => {
            expect(turno.medicoId).toBe(1);
            expect(turno.pacienteId).toBe(1);
            expect(turno.estado).toBe(ESTADOS.RESERVADO);
            expect(turno.fecha).toBe("2030-06-10");
            expect(turno.hora).toBe("10:00");
            expect(turno.duracion).toBe(30);
            expect(turno.historialEstados).toHaveLength(1);
        });
    });

    it("rechaza si el médico no tiene disponibilidad en esa fecha", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-06-10", horaDesde: "09:00", horaHasta: "17:00",
        })
        .then((medico) => turnoService.crearTurno({
            medicoId: medico.id, pacienteId: 1,
            fecha: "2030-06-11", hora: "10:00", duracion: 30,
        }))
        .then(() => { throw new Error("Debería haber rechazado"); })
        .catch((err) => expect(err.message).toMatch(/disponibilidad/i));
    });

    it("rechaza si el turno no entra completo en la ventana de disponibilidad", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-06-10", horaDesde: "09:00", horaHasta: "10:00",
        })
        .then((medico) => turnoService.crearTurno({
            medicoId: medico.id, pacienteId: 1,
            fecha: "2030-06-10", hora: "09:45", duracion: 30, // termina a las 10:15
        }))
        .then(() => { throw new Error("Debería haber rechazado"); })
        .catch((err) => expect(err.message).toMatch(/disponibilidad/i));
    });

    it("rechaza si el nuevo turno se superpone con uno existente", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-06-10", horaDesde: "09:00", horaHasta: "17:00",
        })
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

    it("permite crear un turno inmediatamente después de otro (sin solapamiento)", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-06-10", horaDesde: "09:00", horaHasta: "17:00",
        })
        .then((medico) =>
            turnoService.crearTurno({
                medicoId: medico.id, pacienteId: 1,
                fecha: "2030-06-10", hora: "10:00", duracion: 30,
            })
            .then(() => turnoService.crearTurno({
                medicoId: medico.id, pacienteId: 2,
                fecha: "2030-06-10", hora: "10:30", duracion: 30,
            }))
        )
        .then((turno) => {
            expect(turno.hora).toBe("10:30");
            expect(turno.estado).toBe(ESTADOS.RESERVADO);
        });
    });
});

describe("TurnoService - Cancelación por paciente", () => {

    it("cancela el turno y queda en estado CANCELADO con motivo", () => {
        const { medicoRepository, turnoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-06-10", horaDesde: "09:00", horaHasta: "17:00",
        })
        .then((medico) => turnoService.crearTurno({
            medicoId: medico.id, pacienteId: 1,
            fecha: "2030-06-10", hora: "10:00", duracion: 30,
        }))
        .then((turno) =>
            turnoService.cancelarTurnoPorPaciente(turno.id, 1, "No puedo asistir")
        )
        .then((turno) => {
            expect(turno.estado).toBe(ESTADOS.CANCELADO);
            expect(turno.historialEstados).toHaveLength(2);
            expect(turno.historialEstados[1].motivo).toBe("No puedo asistir");
        });
    });

    it("rechaza si el turno no pertenece al paciente", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-06-10", horaDesde: "09:00", horaHasta: "17:00",
        })
        .then((medico) => turnoService.crearTurno({
            medicoId: medico.id, pacienteId: 1,
            fecha: "2030-06-10", hora: "10:00", duracion: 30,
        }))
        .then((turno) =>
            turnoService.cancelarTurnoPorPaciente(turno.id, 99, "Motivo cualquiera")
        )
        .then(() => { throw new Error("Debería haber rechazado"); })
        .catch((err) => expect(err.message).toMatch(/no pertenece/i));
    });

    it("el slot cancelado queda disponible para ser reservado nuevamente", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-06-10", horaDesde: "09:00", horaHasta: "17:00",
        })
        .then((medico) =>
            turnoService.crearTurno({
                medicoId: medico.id, pacienteId: 1,
                fecha: "2030-06-10", hora: "10:00", duracion: 30,
            })
            .then((turno) =>
                turnoService.cancelarTurnoPorPaciente(turno.id, 1, "Cancelación")
            )
            .then(() => turnoService.crearTurno({
                medicoId: medico.id, pacienteId: 2,
                fecha: "2030-06-10", hora: "10:00", duracion: 30,
            }))
        )
        .then((nuevoTurno) => {
            expect(nuevoTurno.hora).toBe("10:00");
            expect(nuevoTurno.estado).toBe(ESTADOS.RESERVADO);
        });
    });
});

describe("TurnoService - Solicitar cambio de fecha", () => {

    it("pone el turno en PENDIENTE_CAMBIO con la propuesta almacenada", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-06-10", horaDesde: "09:00", horaHasta: "17:00",
        })
        .then((medico) => turnoService.crearTurno({
            medicoId: medico.id, pacienteId: 1,
            fecha: "2030-06-10", hora: "10:00", duracion: 30,
        }))
        .then((turno) =>
            turnoService.solicitarCambioFecha(turno.id, 1, "2030-06-15", "11:00")
        )
        .then((turno) => {
            expect(turno.estado).toBe(ESTADOS.PENDIENTE_CAMBIO);
            expect(turno.solicitudCambioFecha.nuevaFecha).toBe("2030-06-15");
            expect(turno.solicitudCambioFecha.nuevaHora).toBe("11:00");
            expect(turno.solicitudCambioFecha.estado).toBe("pendiente");
        });
    });

    it("rechaza si el turno no pertenece al paciente", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-06-10", horaDesde: "09:00", horaHasta: "17:00",
        })
        .then((medico) => turnoService.crearTurno({
            medicoId: medico.id, pacienteId: 1,
            fecha: "2030-06-10", hora: "10:00", duracion: 30,
        }))
        .then((turno) =>
            turnoService.solicitarCambioFecha(turno.id, 99, "2030-06-15", "11:00")
        )
        .then(() => { throw new Error("Debería haber rechazado"); })
        .catch((err) => expect(err.message).toMatch(/no pertenece/i));
    });
});
