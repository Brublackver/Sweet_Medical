import { describe, it, expect }     from "@jest/globals";
import { TurnoService }             from "../services/TurnoService.js";
import { MedicoService }            from "../services/MedicoService.js";
import { FakeTurnoRepository }      from "./fakes/FakeTurnoRepository.js";
import { FakeMedicoRepository }     from "./fakes/FakeMedicoRepository.js";
import { FakePacienteRepository }   from "./fakes/FakePacienteRepository.js";
import { FakeNotificacionRepository } from "./fakes/FakeNotificacionRepository.js";
import { NotificacionService }      from "../services/NotificacionService.js";
import { ESTADOS }                  from "../domain/Turno.js";
import { USUARIO_TIPOS, TIPOS_NOTIFICACION, RESULTADOS } from "../domain/Notificacion.js";

const crearContexto = () => {
    const medicoRepository   = new FakeMedicoRepository();
    const turnoRepository    = new FakeTurnoRepository();
    const pacienteRepository = new FakePacienteRepository();
    // TurnoService.crearTurno valida que el paciente exista: sembramos dos
    // pacientes (ids 1 y 2). crear() setea el Map de forma sincrónica.
    pacienteRepository.crear({ usuario: "p1", dni: "1", nombre: "Paciente Uno" });
    pacienteRepository.crear({ usuario: "p2", dni: "2", nombre: "Paciente Dos" });
    const medicoService = new MedicoService({ medicoRepository });
    const turnoService  = new TurnoService({ turnoRepository, medicoService, pacienteRepository });
    return { medicoRepository, turnoRepository, pacienteRepository, medicoService, turnoService };
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

describe("TurnoService - Validación al solicitar/proponer cambio de fecha", () => {

    it("rechaza la solicitud del paciente si el médico no tiene disponibilidad en esa fecha/hora", () => {
        const { medicoRepository, turnoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 1,
                    fecha: "2030-06-10", hora: "10:00", duracion: 30,
                })
                .then((turno) =>
                    // El paciente pide cambio a una fecha sin disponibilidad del médico
                    turnoService.solicitarCambioFecha(turno.id, 1, "2030-06-11", "10:00")
                )
            )
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/disponibilidad/i));
    });

    it("rechaza la solicitud del paciente si el nuevo horario se superpone con otro turno", () => {
        const { medicoRepository, turnoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                // Primer turno: 10:00–10:30
                turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 2,
                    fecha: "2030-06-10", hora: "10:00", duracion: 30,
                })
                .then(() =>
                    // Segundo turno del paciente 1: 11:00
                    turnoService.crearTurno({
                        medicoId: medico.id, pacienteId: 1,
                        fecha: "2030-06-10", hora: "11:00", duracion: 30,
                    })
                )
                .then((turno) =>
                    // El paciente 1 pide cambio a 10:15, que solapa con el de paciente 2
                    turnoService.solicitarCambioFecha(turno.id, 1, "2030-06-10", "10:15")
                )
            )
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/superpone/i));
    });

    it("rechaza la propuesta del médico si no tiene disponibilidad en esa fecha/hora", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 1,
                    fecha: "2030-06-10", hora: "10:00", duracion: 30,
                })
                .then((turno) =>
                    turnoService.proponerCambioFecha(turno.id, medico.id, "2030-06-11", "10:00")
                )
            )
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/disponibilidad/i));
    });

    it("acepta la solicitud del paciente cuando el horario es válido y sin solapamiento", () => {
        const { medicoRepository, turnoService } = crearContexto();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 1,
                    fecha: "2030-06-10", hora: "10:00", duracion: 30,
                })
                .then((turno) =>
                    turnoService.solicitarCambioFecha(turno.id, 1, "2030-06-10", "14:00")
                )
            )
            .then((turno) => expect(turno.estado).toBe("pendiente_cambio"));
    });
});

describe("TurnoService - Próximos turnos del paciente", () => {

    // Siembra un turno directamente en el repositorio, salteando la validación
    // de disponibilidad — acá probamos el ordenamiento/filtrado, no la reserva.
    const sembrar = (repo, { pacienteId = 1, fecha, hora, duracion = 30 }) =>
        repo.crear(99, pacienteId, fecha, hora, duracion);

    it("devuelve solo turnos de hoy en adelante, ordenados ascendente por fecha y hora", () => {
        const { turnoRepository, turnoService } = crearContexto();
        const hoy = "2030-06-10";

        return Promise.all([
            sembrar(turnoRepository, { fecha: "2030-06-12", hora: "09:00" }),
            sembrar(turnoRepository, { fecha: "2030-06-10", hora: "15:00" }),
            sembrar(turnoRepository, { fecha: "2030-06-10", hora: "08:00" }),
            sembrar(turnoRepository, { fecha: "2029-01-01", hora: "10:00" }), // pasado → se oculta
        ])
            .then(() => turnoService.proximosTurnosPorPaciente(1, hoy))
            .then((turnos) => {
                expect(turnos.map((t) => `${t.fecha} ${t.hora}`)).toEqual([
                    "2030-06-10 08:00",
                    "2030-06-10 15:00",
                    "2030-06-12 09:00",
                ]);
            });
    });

    it("excluye los turnos cancelados de los próximos", () => {
        const { turnoRepository, turnoService } = crearContexto();

        return sembrar(turnoRepository, { fecha: "2030-06-15", hora: "09:00" })
            .then((turno) => { turno.cancelar("motivo de prueba"); return turnoRepository.actualizar(turno); })
            .then(() => turnoService.proximosTurnosPorPaciente(1, "2030-06-10"))
            .then((turnos) => expect(turnos).toHaveLength(0));
    });
});

describe("TurnoService - Notificaciones bidireccionales", () => {

    // Contexto con servicio de notificaciones inyectado.
    const crearContextoConNotif = () => {
        const { medicoRepository, turnoRepository, turnoService } = crearContexto();
        const notificacionService = new NotificacionService({
            notificacionRepository: new FakeNotificacionRepository(),
        });
        // Reconstruimos el TurnoService con el notificacionService inyectado,
        // reutilizando el mismo turnoRepository y medicoService.
        const servicioConNotif = new TurnoService({
            turnoRepository,
            medicoService:      turnoService.medicoService,
            pacienteRepository: turnoService.pacienteRepository,
            notificacionService,
        });
        return { medicoRepository, turnoRepository, turnoService: servicioConNotif, notificacionService };
    };

    it("notifica al médico cuando el paciente cancela su turno", () => {
        const { turnoRepository, turnoService, notificacionService } = crearContextoConNotif();

        // Turno futuro del paciente 1 con el médico 99.
        return turnoRepository.crear(99, 1, "2030-09-10", "10:00", 30)
            .then((turno) => turnoService.cancelarTurnoPorPaciente(turno.id, 1, "no puedo asistir"))
            .then(() => notificacionService.obtenerPara(USUARIO_TIPOS.MEDICO, 99))
            .then((notificaciones) => {
                expect(notificaciones).toHaveLength(1);
                expect(notificaciones[0].tipo).toBe(TIPOS_NOTIFICACION.TURNO_CANCELADO);
                expect(notificaciones[0].usuarioId).toBe(99);
            });
    });

    it("guarda el resultado ACEPTADO en la notificación del médico al confirmar el cambio del paciente", () => {
        const { medicoRepository, turnoService, notificacionService } = crearContextoConNotif();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 1,
                    fecha: "2030-06-10", hora: "10:00", duracion: 30,
                })
                    .then((turno) => turnoService.solicitarCambioFecha(turno.id, 1, "2030-06-10", "14:00"))
                    .then((turno) => turnoService.confirmarCambioPaciente(turno.id, medico.id))
                    .then(() => notificacionService.obtenerPara(USUARIO_TIPOS.MEDICO, medico.id))
                    .then((notificaciones) => {
                        const solicitud = notificaciones.find(
                            (n) => n.tipo === TIPOS_NOTIFICACION.SOLICITUD_CAMBIO_FECHA
                        );
                        expect(solicitud).toBeDefined();
                        expect(solicitud.leida).toBe(true);
                        expect(solicitud.resultado).toBe(RESULTADOS.ACEPTADO);
                    })
            );
    });

    it("guarda el resultado RECHAZADO en la notificación del médico al rechazar el cambio del paciente", () => {
        const { medicoRepository, turnoService, notificacionService } = crearContextoConNotif();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 1,
                    fecha: "2030-06-10", hora: "10:00", duracion: 30,
                })
                    .then((turno) => turnoService.solicitarCambioFecha(turno.id, 1, "2030-06-10", "14:00"))
                    .then((turno) => turnoService.rechazarCambioPaciente(turno.id, medico.id))
                    .then(() => notificacionService.obtenerPara(USUARIO_TIPOS.MEDICO, medico.id))
                    .then((notificaciones) => {
                        const solicitud = notificaciones.find(
                            (n) => n.tipo === TIPOS_NOTIFICACION.SOLICITUD_CAMBIO_FECHA
                        );
                        expect(solicitud).toBeDefined();
                        expect(solicitud.leida).toBe(true);
                        expect(solicitud.resultado).toBe(RESULTADOS.RECHAZADO);
                    })
            );
    });

    it("guarda el resultado ACEPTADO en la notificación del paciente al confirmar la propuesta del médico", () => {
        const { medicoRepository, turnoService, notificacionService } = crearContextoConNotif();

        return crearMedicoConDisponibilidad(medicoRepository)
            .then((medico) =>
                turnoService.crearTurno({
                    medicoId: medico.id, pacienteId: 1,
                    fecha: "2030-06-10", hora: "10:00", duracion: 30,
                })
                    .then((turno) => turnoService.proponerCambioFecha(turno.id, medico.id, "2030-06-10", "14:00"))
                    .then((turno) => turnoService.confirmarPropuestaMedico(turno.id, 1))
                    .then(() => notificacionService.obtenerPara(USUARIO_TIPOS.PACIENTE, 1))
                    .then((notificaciones) => {
                        const propuesta = notificaciones.find(
                            (n) => n.tipo === TIPOS_NOTIFICACION.PROPUESTA_CAMBIO_FECHA
                        );
                        expect(propuesta).toBeDefined();
                        expect(propuesta.leida).toBe(true);
                        expect(propuesta.resultado).toBe(RESULTADOS.ACEPTADO);
                    })
            );
    });
});
