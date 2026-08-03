import { describe, it, expect } from "@jest/globals";
import { PacienteDemoService } from "../services/PacienteDemoService.js";
import { Paciente }            from "../domain/Paciente.js";

/*
    Fakes mínimos: lo que se testea acá es la POLÍTICA de las cuentas de prueba
    (qué cobertura se asigna, cuánto viven, qué se borra al vencer), no Mongoose.
*/
const crearFakePacienteRepository = () => ({
    _store: new Map(),
    _next: 1,
    _numero: 0,
    siguienteNumeroDemo() { return Promise.resolve(++this._numero); },
    crear(datos) {
        const id = this._next++;
        const p = { ...datos, pacienteId: id };
        this._store.set(id, p);
        return Promise.resolve(p);
    },
    obtenerDemosExpirados(ahora) {
        return Promise.resolve(
            [...this._store.values()].filter((p) => p.esDemo && p.expiraEn <= ahora)
        );
    },
    eliminar(id) { this._store.delete(id); return Promise.resolve(); },
});

const crearFakeBorrador = () => ({
    borrados: [],
    eliminarPorPaciente(id) { this.borrados.push(id); return Promise.resolve(); },
});

const CATALOGO = [{
    nombre: "OSDE",
    planes: [
        { nombre: "110", coberturaGeneral: 0 },
        { nombre: "310", coberturaGeneral: 50 },
        { nombre: "410", coberturaGeneral: 100 },
    ],
}];

const crearContexto = ({ catalogo = CATALOGO, minutosDeVida = 120 } = {}) => {
    const pacienteRepository            = crearFakePacienteRepository();
    const turnoRepository               = crearFakeBorrador();
    const avisoDisponibilidadRepository = crearFakeBorrador();
    const obraSocialService = { obtenerTodas: () => Promise.resolve(catalogo) };

    const servicio = new PacienteDemoService({
        pacienteRepository, turnoRepository, avisoDisponibilidadRepository,
        obraSocialService, minutosDeVida,
    });
    return { servicio, pacienteRepository, turnoRepository, avisoDisponibilidadRepository };
};

describe("Paciente - dominio de cuentas demo", () => {

    it("un paciente normal nunca expira", () => {
        const p = new Paciente(1, "jperez", "30111222", "Juan", "OSDE", null);
        expect(p.estaExpirado()).toBe(false);
        expect(p.minutosRestantes()).toBeNull();
        expect(p.toJSON().es_demo).toBe(false);
    });

    it("una cuenta demo expira cuando pasa su fecha", () => {
        const pasado = new Date(Date.now() - 60000);
        const futuro = new Date(Date.now() + 60 * 60000);

        expect(new Paciente(1, "i", "9", "Invitado", null, null, true, pasado).estaExpirado()).toBe(true);
        expect(new Paciente(2, "i", "9", "Invitado", null, null, true, futuro).estaExpirado()).toBe(false);
    });

    it("informa los minutos que le quedan de vida", () => {
        const p = new Paciente(1, "i", "9", "Invitado", null, null, true, new Date(Date.now() + 90 * 60000));
        expect(p.minutosRestantes()).toBeGreaterThan(88);
        expect(p.minutosRestantes()).toBeLessThanOrEqual(90);
    });

    it("una cuenta vencida informa 0 minutos, no un negativo", () => {
        const p = new Paciente(1, "i", "9", "Invitado", null, null, true, new Date(Date.now() - 10 * 60000));
        expect(p.minutosRestantes()).toBe(0);
    });
});

describe("PacienteDemoService - creación", () => {

    it("crea la cuenta marcada como demo y con vencimiento futuro", () => {
        const { servicio } = crearContexto();

        return servicio.crear().then((p) => {
            expect(p.esDemo).toBe(true);
            expect(p.expiraEn.getTime()).toBeGreaterThan(Date.now());
            expect(p.nombre).toMatch(/Invitado/);
        });
    });

    it("respeta la duración configurada", () => {
        const { servicio } = crearContexto({ minutosDeVida: 30 });

        return servicio.crear().then((p) => {
            const minutos = (p.expiraEn - Date.now()) / 60000;
            expect(minutos).toBeGreaterThan(28);
            expect(minutos).toBeLessThanOrEqual(30);
        });
    });

    it("asigna obra social y prefiere un plan de cobertura PARCIAL", () => {
        const { servicio } = crearContexto();

        return servicio.crear().then((p) => {
            expect(p.obraSocial).toBe("OSDE");
            // El catálogo tiene 0%, 50% y 100%: debe elegir el 50%, que es el
            // único que muestra el cálculo de cobertura en la búsqueda.
            expect(p.plan.coberturaGeneral).toBe(50);
        });
    });

    it("si ningún plan es parcial, igual asigna uno", () => {
        const { servicio } = crearContexto({
            catalogo: [{ nombre: "Swiss", planes: [{ nombre: "Gold", coberturaGeneral: 100 }] }],
        });

        return servicio.crear().then((p) => {
            expect(p.obraSocial).toBe("Swiss");
            expect(p.plan.coberturaGeneral).toBe(100);
        });
    });

    it("sin catálogo disponible el invitado igual se crea, sin cobertura", () => {
        const { servicio } = crearContexto({ catalogo: [] });

        return servicio.crear().then((p) => {
            expect(p.esDemo).toBe(true);
            expect(p.obraSocial).toBeNull();
            expect(p.plan).toBeNull();
        });
    });

    it("cada invitado recibe usuario y DNI distintos", () => {
        const { servicio } = crearContexto();

        return servicio.crear()
            .then((primero) => servicio.crear().then((segundo) => {
                expect(primero.usuario).not.toBe(segundo.usuario);
                expect(primero.dni).not.toBe(segundo.dni);
            }));
    });
});

describe("PacienteDemoService - barrido de vencidas", () => {

    it("borra la cuenta vencida junto con sus turnos y sus avisos", () => {
        const { servicio, pacienteRepository, turnoRepository, avisoDisponibilidadRepository } = crearContexto();

        return servicio.crear()
            .then((p) => {
                // Se fuerza el vencimiento simulando que ya pasó su plazo.
                pacienteRepository._store.get(p.pacienteId).expiraEn = new Date(Date.now() - 1000);
                return servicio.limpiarExpirados();
            })
            .then((barridas) => {
                expect(barridas).toBe(1);
                expect(pacienteRepository._store.size).toBe(0);
                expect(turnoRepository.borrados).toHaveLength(1);
                expect(avisoDisponibilidadRepository.borrados).toHaveLength(1);
            });
    });

    it("no toca las cuentas demo todavía vigentes", () => {
        const { servicio, pacienteRepository, turnoRepository } = crearContexto();

        return servicio.crear()
            .then(() => servicio.limpiarExpirados())
            .then((barridas) => {
                expect(barridas).toBe(0);
                expect(pacienteRepository._store.size).toBe(1);
                expect(turnoRepository.borrados).toHaveLength(0);
            });
    });

    it("crear una cuenta nueva barre las vencidas de paso", () => {
        const { servicio, pacienteRepository } = crearContexto();

        return servicio.crear()
            .then((p) => {
                pacienteRepository._store.get(p.pacienteId).expiraEn = new Date(Date.now() - 1000);
                return servicio.crear();
            })
            .then(() => {
                // Queda solo la nueva: la vencida se limpió sola.
                expect(pacienteRepository._store.size).toBe(1);
                expect([...pacienteRepository._store.values()][0].esDemo).toBe(true);
            });
    });

    it("un fallo del barrido NO impide crear la cuenta de prueba", () => {
        const { servicio, pacienteRepository } = crearContexto();
        pacienteRepository.obtenerDemosExpirados = () => Promise.reject(new Error("base caída"));

        return servicio.crear().then((p) => expect(p.esDemo).toBe(true));
    });
});
