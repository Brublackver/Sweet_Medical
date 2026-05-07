import { describe, it, expect } from "@jest/globals";
import { MedicoService }     from "../services/MedicoService.js";
import { TurnoService }      from "../services/TurnoService.js";
import { MedicoRepository }  from "../repositories/MedicoRepository.js";
import { TurnoRepository }   from "../repositories/TurnoRepository.js";
import { ESTADOS }           from "../domain/Turno.js";

// INVERSIÓN DE DEPENDENCIAS: construimos el grafo completo inyectando dependencias.
const crearContexto = () => {
    const medicoRepository = new MedicoRepository();
    const turnoRepository  = new TurnoRepository();
    const medicoService    = new MedicoService({ medicoRepository });
    const turnoService     = new TurnoService({ turnoRepository, medicoService });
    medicoService.turnoService = turnoService;
    return { medicoRepository, turnoRepository, medicoService, turnoService };
};

// Helper: médico con disponibilidad
const crearMedicoConDisponibilidad = (medicoRepository, config = {}) => {
    const { fecha = "2030-07-10", horaDesde = "09:00", horaHasta = "17:00" } = config;
    return medicoRepository
        .crear({ usuario: "drgomez", matricula: "54321", nombre: "Ana Gómez" })
        .then((medico) => {
            medico.definirDisponibilidad({ fecha, horaDesde, horaHasta });
            return medico;
        });
};

// Helper: reserva un turno futuro para usar en tests de médico
const reservarTurno = (turnoService, medicoId, config = {}) => {
    const { fecha = "2030-07-10", hora = "10:00", duracion = 30, pacienteId = 1 } = config;
    return turnoService.crearTurno({ medicoId, pacienteId, fecha, hora, duracion });
};

describe("MedicoService - Disponibilidad", () => {

    it("define la disponibilidad correctamente", () => {
        const { medicoRepository, medicoService } = crearContexto();

        return medicoService
            .crear({ usuario: "drgomez", matricula: "54321", nombre: "Ana Gómez" })
            .then((medico) =>
                medicoService.definirDisponibilidad(medico.id, {
                    fecha: "2030-07-10", horaDesde: "09:00", horaHasta: "17:00",
                })
            )
            .then(() => medicoService.obtenerDisponibilidad(1))
            .then((disp) => {
                expect(disp["2030-07-10"]).toBeDefined();
                expect(disp["2030-07-10"].horaDesde).toBe("09:00");
                expect(disp["2030-07-10"].turnosReservados).toEqual([]);
            });
    });

    it("calcula los slots disponibles excluyendo los ocupados", () => {
        const { medicoRepository, turnoService, medicoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-07-10", horaDesde: "09:00", horaHasta: "10:00",
        })
        .then((medico) =>
            reservarTurno(turnoService, medico.id, { hora: "09:00", duracion: 30 })
                .then(() => medicoService.consultarSlotsDisponibles(medico.id, "2030-07-10", 30))
        )
        .then((resultado) => {
            // 09:00 ocupado, 09:30 libre
            expect(resultado.slotsDisponibles).not.toContain("09:00");
            expect(resultado.slotsDisponibles).toContain("09:30");
        });
    });
});

describe("MedicoService - Cancelar turno", () => {

    it("cancela el turno con motivo y lo marca como CANCELADO", () => {
        const { medicoRepository, turnoService, medicoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                reservarTurno(turnoService, medico.id)
                    .then((turno) => medicoService.cancelarTurno(medico.id, turno.id, "Médico no disponible"))
            )
            .then((turno) => {
                expect(turno.estado).toBe(ESTADOS.CANCELADO);
                expect(turno.historialEstados.at(-1).motivo).toBe("Médico no disponible");
            });
    });

    it("rechaza si el turno no pertenece al médico", () => {
        const { medicoRepository, turnoService, medicoService } = crearContexto();

        // Creamos dos médicos: el turno es del médico 1, el médico 2 intenta cancelarlo
        return Promise.all([
            crearMedicoConDisponibilidad(medicoRepository),
            medicoRepository.crear({ usuario: "drotro", matricula: "11111", nombre: "Otro Médico" }),
        ])
        .then(([medico1, medico2]) =>
            reservarTurno(turnoService, medico1.id)
                .then((turno) => medicoService.cancelarTurno(medico2.id, turno.id, "Motivo"))
        )
        .then(() => { throw new Error("Debería haber rechazado"); })
        .catch((err) => expect(err.message).toMatch(/no pertenece/i));
    });
});

describe("MedicoService - Historial de turnos de un paciente", () => {

    it("retorna solo los turnos del paciente con ese médico", () => {
        const { medicoRepository, turnoService, medicoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                Promise.all([
                    reservarTurno(turnoService, medico.id, { hora: "10:00", pacienteId: 1 }),
                    reservarTurno(turnoService, medico.id, { hora: "10:30", pacienteId: 2 }),
                ])
                .then(() => medicoService.historialTurnosDePaciente(medico.id, 1))
            )
            .then((turnos) => {
                expect(turnos).toHaveLength(1);
                expect(turnos[0].pacienteId).toBe(1);
            });
    });
});

describe("MedicoService - Proponer cambio de fecha", () => {

    it("pone el turno en PROPUESTA_MEDICO con la propuesta almacenada", () => {
        const { medicoRepository, turnoService, medicoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                reservarTurno(turnoService, medico.id)
                    .then((turno) =>
                        medicoService.proponerCambioFecha(medico.id, turno.id, "2030-07-20", "11:00")
                    )
            )
            .then((turno) => {
                expect(turno.estado).toBe(ESTADOS.PROPUESTA_MEDICO);
                expect(turno.propuestaMedicoFecha.nuevaFecha).toBe("2030-07-20");
                expect(turno.propuestaMedicoFecha.estado).toBe("pendiente");
            });
    });
});

describe("MedicoService - Confirmar/rechazar solicitud del paciente", () => {

    it("confirma la solicitud del paciente y aplica la nueva fecha", () => {
        const { medicoRepository, turnoService, medicoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository, {
            fecha: "2030-07-10", horaDesde: "09:00", horaHasta: "17:00",
        })
        .then((medico) => {
            medico.definirDisponibilidad({
                fecha: "2030-07-20", horaDesde: "09:00", horaHasta: "17:00",
            });
            return reservarTurno(turnoService, medico.id)
                .then((turno) =>
                    turnoService.solicitarCambioFecha(turno.id, 1, "2030-07-20", "11:00")
                )
                .then((turno) =>
                    medicoService.confirmarCambioPaciente(medico.id, turno.id)
                );
        })
        .then((turno) => {
            expect(turno.estado).toBe(ESTADOS.RESERVADO);
            expect(turno.fecha).toBe("2030-07-20");
            expect(turno.hora).toBe("11:00");
            expect(turno.solicitudCambioFecha).toBeNull();
        });
    });

    it("rechaza la solicitud del paciente y mantiene la fecha original", () => {
        const { medicoRepository, turnoService, medicoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                reservarTurno(turnoService, medico.id)
                    .then((turno) =>
                        turnoService.solicitarCambioFecha(turno.id, 1, "2030-07-20", "11:00")
                    )
                    .then((turno) =>
                        medicoService.rechazarCambioPaciente(medico.id, turno.id)
                    )
            )
            .then((turno) => {
                expect(turno.estado).toBe(ESTADOS.RESERVADO);
                expect(turno.fecha).toBe("2030-07-10");
                expect(turno.solicitudCambioFecha).toBeNull();
            });
    });
});

describe("MedicoService - Marcar turno como realizado", () => {

    it("marca como REALIZADO un turno cuya fecha ya pasó", () => {
        const { medicoRepository, turnoRepository, medicoService } = crearContexto();

        // Usamos una fecha pasada para que puedeMarcarseRealizado() sea true
        return medicoRepository
            .crear({ usuario: "drgomez", matricula: "54321", nombre: "Ana Gómez" })
            .then((medico) => {
                medico.definirDisponibilidad({
                    fecha: "2020-01-15", horaDesde: "09:00", horaHasta: "17:00",
                });
                return turnoRepository
                    .crear(medico.id, 1, "2020-01-15", "10:00", 30)
                    .then((turno) => medicoService.marcarTurnoRealizado(medico.id, turno.id));
            })
            .then((turno) => {
                expect(turno.estado).toBe(ESTADOS.REALIZADO);
            });
    });

    it("rechaza si el turno aún no ocurrió", () => {
        const { medicoRepository, turnoService, medicoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                reservarTurno(turnoService, medico.id) // fecha futura
                    .then((turno) => medicoService.marcarTurnoRealizado(medico.id, turno.id))
            )
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/no ocurrió/i));
    });
});
