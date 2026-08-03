import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { iniciarDB, detenerDB, limpiarColecciones } from "./setup.js";

import { AvisoDisponibilidadRepository } from "../../repositories/AvisoDisponibilidadRepository.js";
import { PersonalRepository }            from "../../repositories/PersonalRepository.js";
import { ObraSocialRepository }          from "../../repositories/ObraSocialRepository.js";
import { PersonalService }               from "../../services/PersonalService.js";
import { ObraSocialService }             from "../../services/ObraSocialService.js";
import { AvisoDisponibilidadService }    from "../../services/AvisoDisponibilidadService.js";
import { TIPOS_PERSONAL }                from "../../domain/Personal.js";
import { ESTADOS_AVISO }                 from "../../domain/AvisoDisponibilidad.js";

/*
    Persistencia REAL de los tres módulos nuevos contra MongoDB.

    Los tests unitarios usan fakes en memoria y no ven Mongoose: acá se verifica
    lo que solo aparece con la base de verdad — índices únicos, subdocumentos
    embebidos, loadClass y, sobre todo, que la re-siembra del catálogo NO borre
    las suscripciones (que es exactamente lo que hacía el deleteMany anterior).
*/

const avisoRepository    = new AvisoDisponibilidadRepository();
const personalRepository = new PersonalRepository();
const obraSocialRepository = new ObraSocialRepository();

const personalService   = new PersonalService({ personalRepository });
const obraSocialService = new ObraSocialService({ obraSocialRepository });

beforeAll(() => iniciarDB().then(() => mongoose.syncIndexes()));
afterAll(() => detenerDB());
beforeEach(() => limpiarColecciones());

describe("AvisoDisponibilidad - persistencia", () => {

    it("persiste los filtros y responde a los métodos de dominio (loadClass)", () =>
        avisoRepository.crear(1, { especialidad: "Cardiología", fechaDesde: "2026-03-01", fechaHasta: "2026-03-31" })
            .then((aviso) => avisoRepository.obtenerPorId(aviso.id))
            .then((aviso) => {
                expect(aviso.filtros.especialidad).toBe("Cardiología");
                expect(aviso.estado).toBe(ESTADOS_AVISO.ACTIVO);
                // Los métodos del dominio viven en el documento de Mongoose.
                expect(aviso.cubreFecha("2026-03-15")).toBe(true);
                expect(aviso.cubreFecha("2026-04-15")).toBe(false);
                expect(aviso.aplicaAlMedico(9)).toBe(true);
                expect(aviso.toJSON().descripcion).toBe("Cardiología");
            }));

    it("el índice único parcial impide DOS avisos activos idénticos del mismo paciente", () => {
        const filtros = { especialidad: "Cardiología" };
        return avisoRepository.crear(1, filtros)
            .then(() => avisoRepository.crear(1, filtros))
            .then(() => { throw new Error("La base debería haber rechazado el duplicado"); })
            .catch((err) => expect(err.code).toBe(11000));
    });

    it("tras cancelar, el paciente PUEDE volver a suscribirse a la misma búsqueda", () => {
        const filtros = { especialidad: "Cardiología" };
        return avisoRepository.crear(1, filtros)
            .then((aviso) => { aviso.cancelar(); return avisoRepository.actualizar(aviso); })
            .then(() => avisoRepository.crear(1, filtros))
            .then((nuevo) => expect(nuevo.estado).toBe(ESTADOS_AVISO.ACTIVO));
    });

    it("el service no duplica: devuelve el aviso activo que ya existía", () => {
        const service = new AvisoDisponibilidadService({ avisoDisponibilidadRepository: avisoRepository });
        return service.crear(1, { sede: "Medrano" })
            .then((primero) => service.crear(1, { sede: "  medrano " })
                .then((segundo) => expect(segundo.id).toBe(primero.id)))
            .then(() => avisoRepository.obtenerPorPaciente(1))
            .then((avisos) => expect(avisos).toHaveLength(1));
    });

    it("obtenerActivos deja fuera los cancelados y los ya notificados", () =>
        Promise.all([
            avisoRepository.crear(1, { sede: "Medrano" }),
            avisoRepository.crear(2, { sede: "Campus" }),
            avisoRepository.crear(3, { sede: "Otra" }),
        ])
            .then(([, segundo, tercero]) => {
                segundo.cancelar();
                tercero.marcarNotificado();
                return Promise.all([
                    avisoRepository.actualizar(segundo),
                    avisoRepository.actualizar(tercero),
                ]);
            })
            .then(() => avisoRepository.obtenerActivos())
            .then((activos) => {
                expect(activos).toHaveLength(1);
                expect(activos[0].pacienteId).toBe(1);
            }));
});

describe("Personal - persistencia", () => {

    const datos = (overrides = {}) => ({
        nombre: "Lucía", apellido: "Gómez", documento: "30111222",
        tipo: TIPOS_PERSONAL.ADMINISTRACION, ...overrides,
    });

    it("guarda el legajo con fecha de alta y expone el nombre completo", () =>
        personalService.crear(datos())
            .then((p) => personalService.obtenerPorId(p.id))
            .then((p) => {
                expect(p.activo).toBe(true);
                expect(p.fechaAlta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                expect(p.toJSON().nombre_completo).toBe("Gómez, Lucía");
                expect(p.toJSON().tipo_label).toBe("Administración");
            }));

    it("el documento es único a nivel base", () =>
        personalService.crear(datos())
            .then(() => personalService.crear(datos({ nombre: "Otra" })))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/ya existe personal/i)));

    it("filtra por tipo y estado con la query real", () =>
        personalService.crear(datos())
            .then(() => personalService.crear(datos({ documento: "30999888", tipo: TIPOS_PERSONAL.LIMPIEZA })))
            .then((limpieza) => personalService.cambiarEstado(limpieza.id, false))
            .then(() => personalService.obtenerTodos({ tipo: TIPOS_PERSONAL.LIMPIEZA, activo: false }))
            .then((inactivos) => {
                expect(inactivos).toHaveLength(1);
                expect(inactivos[0].fechaBaja).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            }));

    it("la baja lógica conserva el registro; el borrado físico lo saca", () =>
        personalService.crear(datos())
            .then((p) => personalService.cambiarEstado(p.id, false).then(() => p.id))
            .then((id) => personalService.obtenerPorId(id).then(() => personalService.eliminar(id)).then(() => id))
            .then((id) => personalService.obtenerPorId(id))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/no encontrado/i)));
});

describe("ObraSocial - suscripción y re-siembra del catálogo", () => {

    it("inicializar siembra el catálogo definido en código", () =>
        obraSocialRepository.inicializar()
            .then(() => obraSocialService.obtenerTodas())
            .then((catalogo) => {
                expect(catalogo).toHaveLength(2);
                expect(catalogo.map((o) => o.nombre).sort()).toEqual(["OSDE", "Swiss Medical"]);
                expect(catalogo[0].planes).toHaveLength(4);
            }));

    it("REGRESIÓN: re-inicializar NO borra la suscripción ni el estado de alta", () =>
        obraSocialRepository.inicializar()
            .then(() => obraSocialService.obtenerTodas())
            .then((catalogo) => {
                const osde = catalogo.find((o) => o.nombre === "OSDE");
                return obraSocialService.registrarSuscripcion(osde.id, {
                    modalidad: "PREMIUM",
                    fechaInicio: "2026-01-01",
                    fechaVencimiento: "2026-12-31",
                    caracteristicas: [{ clave: "tope_mensual", valor: "150000" }],
                }).then(() => obraSocialService.cambiarEstado(osde.id, false)).then(() => osde.id);
            })
            // Segundo arranque del servidor: se vuelve a sincronizar el catálogo.
            .then((osdeId) => obraSocialRepository.inicializar().then(() => osdeId))
            .then((osdeId) => obraSocialService.consultarEstado(osdeId))
            .then((estado) => {
                expect(estado.tiene_suscripcion).toBe(true);
                expect(estado.suscripcion.modalidad).toBe("PREMIUM");
                expect(estado.suscripcion.caracteristicas).toHaveLength(1);
                expect(estado.suscripcion.caracteristicas[0].clave).toBe("tope_mensual");
                expect(estado.activa).toBe(false);
            }));

    it("re-inicializar tampoco duplica obras sociales", () =>
        obraSocialRepository.inicializar()
            .then(() => obraSocialRepository.inicializar())
            .then(() => obraSocialRepository.inicializar())
            .then(() => obraSocialService.obtenerTodas())
            .then((catalogo) => expect(catalogo).toHaveLength(2)));

    it("filtra por estado de alta y por vigencia de la suscripción", () =>
        obraSocialService.crear({ nombre: "Galeno", planes: [] })
            .then((galeno) => obraSocialService.registrarSuscripcion(galeno.id, {
                fechaInicio: "2020-01-01", fechaVencimiento: "2020-12-31",  // vencida
            }))
            .then(() => obraSocialService.crear({ nombre: "Medifé", planes: [] }))
            .then((medife) => obraSocialService.registrarSuscripcion(medife.id, {}))  // sin vencimiento
            .then(() => obraSocialService.obtenerTodas({ vigente: true }))
            .then((vigentes) => {
                expect(vigentes).toHaveLength(1);
                expect(vigentes[0].nombre).toBe("Medifé");
                return obraSocialService.obtenerTodas({ vigente: false });
            })
            .then((noVigentes) => {
                expect(noVigentes).toHaveLength(1);
                expect(noVigentes[0].nombre).toBe("Galeno");
            }));

    it("suspender la suscripción la deja no vigente y persiste el cambio", () =>
        obraSocialService.crear({ nombre: "Galeno", planes: [] })
            .then((galeno) => obraSocialService.registrarSuscripcion(galeno.id, {}).then(() => galeno.id))
            .then((id) => obraSocialService.cambiarEstadoSuscripcion(id, false).then(() => id))
            .then((id) => obraSocialService.consultarEstado(id))
            .then((estado) => {
                expect(estado.suscripcion.estado).toBe("SUSPENDIDA");
                expect(estado.suscripcion_vigente).toBe(false);
            }));

    it("no se puede cambiar el estado de una suscripción inexistente", () =>
        obraSocialService.crear({ nombre: "Galeno", planes: [] })
            .then((galeno) => obraSocialService.cambiarEstadoSuscripcion(galeno.id, true))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/no tiene una suscripción/i)));

    it("no permite dos obras sociales con el mismo nombre", () =>
        obraSocialService.crear({ nombre: "Galeno", planes: [] })
            .then(() => obraSocialService.crear({ nombre: "galeno", planes: [] }))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/ya existe una obra social/i)));
});
