import { describe, it, expect }      from "@jest/globals";
import { PacienteService }           from "../services/PacienteService.js";
import { TurnoService }              from "../services/TurnoService.js";
import { MedicoService }             from "../services/MedicoService.js";
import { FakePacienteRepository }    from "./fakes/FakePacienteRepository.js";
import { FakeTurnoRepository }       from "./fakes/FakeTurnoRepository.js";
import { FakeMedicoRepository }      from "./fakes/FakeMedicoRepository.js";
import { ESTADOS }                   from "../domain/Turno.js";

const crearContexto = () => {
    const medicoRepository   = new FakeMedicoRepository();
    const turnoRepository    = new FakeTurnoRepository();
    const pacienteRepository = new FakePacienteRepository();
    const medicoService      = new MedicoService({ medicoRepository });
    const turnoService       = new TurnoService({ turnoRepository, medicoService });
    medicoService.setTurnoService(turnoService);
    const pacienteService    = new PacienteService({ pacienteRepository, turnoService });
    return { medicoRepository, pacienteService };
};

const crearMedicoConDisponibilidad = (medicoRepository, config = {}) => {
    const { fecha = "2030-08-20", horaDesde = "09:00", horaHasta = "17:00" } = config;
    return medicoRepository
        .crear({ usuario: "drsmith", matricula: "99999", nombre: "John Smith" })
        .then((medico) => {
            medico.definirDisponibilidad({ fecha, horaDesde, horaHasta });
            return medico;
        });
};

describe("PacienteService - Crear paciente", () => {

    it("crea un paciente con datos válidos y retorna el objeto con id asignado", () => {
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
});

describe("PacienteService - Reservar turno", () => {

    it("reserva un turno válido para el paciente y retorna estado RESERVADO", () => {
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
        )
        .then((turno) => {
            expect(turno.estado).toBe(ESTADOS.RESERVADO);
            expect(turno.pacienteId).toBeDefined();
        });
    });
});
