import { describe, it, expect } from "@jest/globals";
import { AvisoDisponibilidadService } from "../services/AvisoDisponibilidadService.js";
import { NotificacionService }        from "../services/NotificacionService.js";
import { FakeAvisoDisponibilidadRepository } from "./fakes/FakeAvisoDisponibilidadRepository.js";
import { FakeNotificacionRepository }        from "./fakes/FakeNotificacionRepository.js";
import { AvisoDisponibilidad, ESTADOS_AVISO } from "../domain/AvisoDisponibilidad.js";
import { USUARIO_TIPOS, TIPOS_NOTIFICACION }  from "../domain/Notificacion.js";

/*
    La búsqueda se falsea con un stub: lo que importa acá NO es cómo se calculan
    los slots (eso ya lo cubre BusquedaService) sino la decisión de la fila de
    espera — a quién notificar, cuándo, y una sola vez.

    `respuesta` decide si la búsqueda "encuentra" turnos. `llamadas` deja ver con
    qué filtros se consultó, que es la parte que podría romperse en silencio.
*/
const crearBusquedaStub = (hayTurnos) => ({
    llamadas: [],
    buscar(filtros) {
        this.llamadas.push(filtros);
        return Promise.resolve(
            hayTurnos ? [{ fecha: filtros.fechaDesde, turnos: [{ hora: "10:00" }] }] : []
        );
    },
});

const crearContexto = (hayTurnos = true) => {
    const avisoDisponibilidadRepository = new FakeAvisoDisponibilidadRepository();
    const notificacionRepository        = new FakeNotificacionRepository();
    const notificacionService           = new NotificacionService({ notificacionRepository });
    const busquedaService               = crearBusquedaStub(hayTurnos);
    const avisoDisponibilidadService    = new AvisoDisponibilidadService({
        avisoDisponibilidadRepository, notificacionService, busquedaService,
    });
    return { avisoDisponibilidadService, notificacionService, busquedaService, avisoDisponibilidadRepository };
};

describe("AvisoDisponibilidad - dominio", () => {

    it("dos búsquedas con los mismos filtros producen la misma huella, sin importar mayúsculas ni espacios", () => {
        const a = AvisoDisponibilidad.calcularHuella({ especialidad: "Cardiología", sede: "Medrano" });
        const b = AvisoDisponibilidad.calcularHuella({ especialidad: "  cardiología ", sede: "MEDRANO" });
        expect(a).toBe(b);
    });

    it("filtros distintos producen huellas distintas", () => {
        const a = AvisoDisponibilidad.calcularHuella({ especialidad: "Cardiología" });
        const b = AvisoDisponibilidad.calcularHuella({ especialidad: "Pediatría" });
        expect(a).not.toBe(b);
    });

    it("cubreFecha respeta el rango pedido", () => {
        const aviso = new AvisoDisponibilidad(1, 1, { fechaDesde: "2026-03-10", fechaHasta: "2026-03-20" });
        expect(aviso.cubreFecha("2026-03-15")).toBe(true);
        expect(aviso.cubreFecha("2026-03-10")).toBe(true);
        expect(aviso.cubreFecha("2026-03-20")).toBe(true);
        expect(aviso.cubreFecha("2026-03-09")).toBe(false);
        expect(aviso.cubreFecha("2026-03-21")).toBe(false);
    });

    it("un aviso sin médico escucha a todos; con médico solo al suyo", () => {
        const general    = new AvisoDisponibilidad(1, 1, {});
        const especifico = new AvisoDisponibilidad(2, 1, { medicoId: 7 });
        expect(general.aplicaAlMedico(3)).toBe(true);
        expect(especifico.aplicaAlMedico(7)).toBe(true);
        expect(especifico.aplicaAlMedico(3)).toBe(false);
    });
});

describe("AvisoDisponibilidadService - alta y baja", () => {

    it("no duplica suscripciones idénticas: devuelve la que ya existía", () => {
        const { avisoDisponibilidadService } = crearContexto();
        const filtros = { especialidad: "Cardiología", sede: "Medrano" };

        return avisoDisponibilidadService.crear(1, filtros)
            .then((primero) =>
                avisoDisponibilidadService.crear(1, { especialidad: "CARDIOLOGÍA", sede: "medrano" })
                    .then((segundo) => {
                        expect(segundo.id).toBe(primero.id);
                        return avisoDisponibilidadService.obtenerPorPaciente(1);
                    })
            )
            .then((avisos) => expect(avisos).toHaveLength(1));
    });

    it("dos pacientes pueden tener el mismo aviso sin pisarse", () => {
        const { avisoDisponibilidadService } = crearContexto();
        const filtros = { especialidad: "Cardiología" };

        return Promise.all([
            avisoDisponibilidadService.crear(1, filtros),
            avisoDisponibilidadService.crear(2, filtros),
        ]).then(([uno, dos]) => expect(uno.id).not.toBe(dos.id));
    });

    it("cancelar rechaza si el aviso no es del paciente", () => {
        const { avisoDisponibilidadService } = crearContexto();

        return avisoDisponibilidadService.crear(1, { especialidad: "Cardiología" })
            .then((aviso) => avisoDisponibilidadService.cancelar(99, aviso.id))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/no pertenece/i));
    });

    it("un aviso cancelado deja de estar en la cola de evaluación", () => {
        const { avisoDisponibilidadService, avisoDisponibilidadRepository } = crearContexto();

        return avisoDisponibilidadService.crear(1, {})
            .then((aviso) => avisoDisponibilidadService.cancelar(1, aviso.id))
            .then(() => avisoDisponibilidadRepository.obtenerActivos())
            .then((activos) => expect(activos).toHaveLength(0));
    });
});

describe("AvisoDisponibilidadService - evaluación y notificación", () => {

    it("notifica al paciente cuando aparece un turno que coincide", () => {
        const { avisoDisponibilidadService, notificacionService } = crearContexto(true);

        return avisoDisponibilidadService.crear(1, { especialidad: "Cardiología" })
            .then(() => avisoDisponibilidadService.evaluarPorMedicoYFecha(5, "2026-03-15"))
            .then((notificados) => {
                expect(notificados).toHaveLength(1);
                return notificacionService.obtenerPara(USUARIO_TIPOS.PACIENTE, 1);
            })
            .then((notificaciones) => {
                expect(notificaciones).toHaveLength(1);
                expect(notificaciones[0].tipo).toBe(TIPOS_NOTIFICACION.TURNO_DISPONIBLE);
                expect(notificaciones[0].mensaje).toMatch(/2026-03-15/);
            });
    });

    it("NO notifica dos veces por el mismo aviso: tras avisar queda NOTIFICADO", () => {
        const { avisoDisponibilidadService, notificacionService } = crearContexto(true);

        return avisoDisponibilidadService.crear(1, {})
            .then(() => avisoDisponibilidadService.evaluarPorMedicoYFecha(5, "2026-03-15"))
            .then((primera) => {
                expect(primera[0].estado).toBe(ESTADOS_AVISO.NOTIFICADO);
                // Segunda cancelación sobre el mismo médico y fecha: ya no debe avisar.
                return avisoDisponibilidadService.evaluarPorMedicoYFecha(5, "2026-03-15");
            })
            .then((segunda) => {
                expect(segunda).toHaveLength(0);
                return notificacionService.obtenerPara(USUARIO_TIPOS.PACIENTE, 1);
            })
            .then((notificaciones) => expect(notificaciones).toHaveLength(1));
    });

    it("no notifica si la fecha liberada cae fuera del rango del aviso", () => {
        const { avisoDisponibilidadService, busquedaService } = crearContexto(true);

        return avisoDisponibilidadService.crear(1, { fechaDesde: "2026-04-01", fechaHasta: "2026-04-30" })
            .then(() => avisoDisponibilidadService.evaluarPorMedicoYFecha(5, "2026-03-15"))
            .then((notificados) => {
                expect(notificados).toHaveLength(0);
                // Ni siquiera se lanzó la búsqueda: el prefiltro lo descartó antes.
                expect(busquedaService.llamadas).toHaveLength(0);
            });
    });

    it("no notifica si el aviso apunta a otro médico", () => {
        const { avisoDisponibilidadService, busquedaService } = crearContexto(true);

        return avisoDisponibilidadService.crear(1, { medicoId: 99 })
            .then(() => avisoDisponibilidadService.evaluarPorMedicoYFecha(5, "2026-03-15"))
            .then((notificados) => {
                expect(notificados).toHaveLength(0);
                expect(busquedaService.llamadas).toHaveLength(0);
            });
    });

    it("no notifica si la búsqueda real no encuentra turnos para esos filtros", () => {
        const { avisoDisponibilidadService, busquedaService } = crearContexto(false);

        return avisoDisponibilidadService.crear(1, { especialidad: "Cardiología" })
            .then(() => avisoDisponibilidadService.evaluarPorMedicoYFecha(5, "2026-03-15"))
            .then((notificados) => {
                expect(notificados).toHaveLength(0);
                // Acá SÍ se consultó: el prefiltro pasó y decidió la búsqueda real.
                expect(busquedaService.llamadas).toHaveLength(1);
                expect(busquedaService.llamadas[0].especialidad).toBe("Cardiología");
                expect(busquedaService.llamadas[0].fechaDesde).toBe("2026-03-15");
                expect(busquedaService.llamadas[0].fechaHasta).toBe("2026-03-15");
            });
    });

    it("sin busquedaService inyectado la evaluación es un no-op (no rompe)", () => {
        const avisoDisponibilidadService = new AvisoDisponibilidadService({
            avisoDisponibilidadRepository: new FakeAvisoDisponibilidadRepository(),
        });

        return avisoDisponibilidadService.evaluarPorMedicoYFecha(1, "2026-03-15")
            .then((notificados) => expect(notificados).toEqual([]));
    });
});
