import { describe, it, expect }      from "@jest/globals";
import { PacienteService }           from "../services/PacienteService.js";
import { TurnoService }              from "../services/TurnoService.js";
import { MedicoService }             from "../services/MedicoService.js";
import { FakePacienteRepository }    from "./fakes/FakePacienteRepository.js";
import { FakeTurnoRepository }       from "./fakes/FakeTurnoRepository.js";
import { FakeMedicoRepository }      from "./fakes/FakeMedicoRepository.js";
import { ESTADOS }                   from "../domain/Turno.js";

// INVERSIÓN DE DEPENDENCIAS: construimos el grafo completo de dependencias
// inyectándolas desde afuera. Cada test parte de un estado limpio.
const crearContexto = () => {
    const medicoRepository   = new FakeMedicoRepository();
    const turnoRepository    = new FakeTurnoRepository();
    const pacienteRepository = new FakePacienteRepository();

    const medicoService  = new MedicoService({ medicoRepository });
    const turnoService   = new TurnoService({ turnoRepository, medicoService });
    medicoService.turnoService = turnoService;

    const pacienteService = new PacienteService({ pacienteRepository, turnoService });

    return { medicoRepository, pacienteRepository, medicoService, turnoService, pacienteService };
};

// Helper: crea un médico con disponibilidad y retorna el objeto médico
const crearMedicoConDisponibilidad = (medicoRepository, overrides = {}) => {
    const defaults = { fecha: "2030-08-20", horaDesde: "09:00", horaHasta: "17:00" };
    const config   = { ...defaults, ...overrides };
    return medicoRepository
        .crear({ usuario: "drsmith", matricula: "99999", nombre: "John Smith" })
        .then((medico) => {
            medico.definirDisponibilidad(config);
            return medico;
        });
};

describe("PacienteService - Crear paciente", () => {

    it("crea un paciente con datos válidos", () => {
        const { pacienteService } = crearContexto();

        return pacienteService.crear({
            usuario: "juanperez", dni: "12345678",
            nombre: "Juan Pérez", obraSocial: "OSDE", plan: "210",
        })
        .then((paciente) => {
            expect(paciente.id).toBeDefined();
            expect(paciente.dni).toBe("12345678");
            expect(paciente.obraSocial).toBe("OSDE");
        });
    });

    it("rechaza si el DNI ya está registrado", () => {
        const { pacienteService } = crearContexto();
        const datos = {
            usuario: "juanperez", dni: "12345678",
            nombre: "Juan Pérez", obraSocial: "OSDE", plan: "210",
        };

        return pacienteService.crear(datos)
            .then(() => pacienteService.crear({ ...datos, usuario: "juanperez2" }))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/12345678/));
    });
});

describe("PacienteService - Reservar turno", () => {

    it("reserva un turno válido para el paciente", () => {
        const { medicoRepository, pacienteService } = crearContexto();

        return Promise.all([
            pacienteService.crear({
                usuario: "juanperez", dni: "12345678",
                nombre: "Juan Pérez", obraSocial: "OSDE", plan: "210",
            }),
            crearMedicoConDisponibilidad(medicoRepository),
        ])
        .then(([paciente, medico]) =>
            pacienteService.reservarTurno(paciente.id, {
                medicoId: medico.id,
                fecha: "2030-08-20", hora: "10:00", duracion: 30,
            })
        )
        .then((turno) => {
            expect(turno.estado).toBe(ESTADOS.RESERVADO);
            expect(turno.pacienteId).toBeDefined();
        });
    });

    it("rechaza si el paciente no existe", () => {
        const { pacienteService } = crearContexto();

        return pacienteService.reservarTurno(999, {
            medicoId: 1, fecha: "2030-08-20", hora: "10:00", duracion: 30,
        })
        .then(() => { throw new Error("Debería haber rechazado"); })
        .catch((err) => expect(err.message).toMatch(/paciente/i));
    });
});

describe("PacienteService - Historial de turnos", () => {

    it("retorna todos los turnos del paciente incluyendo cancelados", () => {
        const { medicoRepository, pacienteService } = crearContexto();

        return Promise.all([
            pacienteService.crear({
                usuario: "juanperez", dni: "12345678",
                nombre: "Juan Pérez", obraSocial: "OSDE", plan: "210",
            }),
            crearMedicoConDisponibilidad(medicoRepository),
        ])
        .then(([paciente, medico]) =>
            pacienteService.reservarTurno(paciente.id, {
                medicoId: medico.id, fecha: "2030-08-20", hora: "10:00", duracion: 30,
            })
            .then((turno) =>
                pacienteService.cancelarTurno(paciente.id, turno.id, "No puedo asistir")
            )
            .then(() => pacienteService.reservarTurno(paciente.id, {
                medicoId: medico.id, fecha: "2030-08-20", hora: "11:00", duracion: 30,
            }))
            .then(() => pacienteService.historialTurnos(paciente.id))
        )
        .then((turnos) => {
            expect(turnos).toHaveLength(2);
            const estados = turnos.map((t) => t.estado);
            expect(estados).toContain(ESTADOS.CANCELADO);
            expect(estados).toContain(ESTADOS.RESERVADO);
        });
    });
});

describe("PacienteService - Solicitar cambio de fecha", () => {

    it("pone el turno en PENDIENTE_CAMBIO con la propuesta", () => {
        const { medicoRepository, pacienteService } = crearContexto();

        return Promise.all([
            pacienteService.crear({
                usuario: "juanperez", dni: "12345678",
                nombre: "Juan Pérez", obraSocial: "OSDE", plan: "210",
            }),
            crearMedicoConDisponibilidad(medicoRepository),
        ])
        .then(([paciente, medico]) =>
            pacienteService.reservarTurno(paciente.id, {
                medicoId: medico.id, fecha: "2030-08-20", hora: "10:00", duracion: 30,
            })
            .then((turno) =>
                pacienteService.solicitarCambioFecha(paciente.id, turno.id, "2030-08-25", "14:00")
            )
        )
        .then((turno) => {
            expect(turno.estado).toBe(ESTADOS.PENDIENTE_CAMBIO);
            expect(turno.solicitudCambioFecha.nuevaFecha).toBe("2030-08-25");
            expect(turno.solicitudCambioFecha.estado).toBe("pendiente");
        });
    });
});
