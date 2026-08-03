import { describe, it, expect }    from "@jest/globals";
import { PersonalService }         from "../services/PersonalService.js";
import { FakePersonalRepository }  from "./fakes/FakePersonalRepository.js";
import { TIPOS_PERSONAL }          from "../domain/Personal.js";

const crearContexto = () => {
    const personalRepository = new FakePersonalRepository();
    const personalService    = new PersonalService({ personalRepository });
    return { personalRepository, personalService };
};

const datosBase = (overrides = {}) => ({
    nombre:    "Lucía",
    apellido:  "Gómez",
    documento: "30111222",
    telefono:  "1155667788",
    email:     "lucia@sweetmedical.com",
    tipo:      TIPOS_PERSONAL.ADMINISTRACION,
    ...overrides,
});

describe("PersonalService - alta", () => {

    it("crea personal activo y con fecha de alta", () => {
        const { personalService } = crearContexto();

        return personalService.crear(datosBase())
            .then((personal) => {
                expect(personal.activo).toBe(true);
                expect(personal.fechaAlta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                expect(personal.tipo).toBe(TIPOS_PERSONAL.ADMINISTRACION);
            });
    });

    it("rechaza dos legajos con el mismo documento", () => {
        const { personalService } = crearContexto();

        return personalService.crear(datosBase())
            .then(() => personalService.crear(datosBase({ nombre: "Otro" })))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/ya existe personal/i));
    });
});

describe("PersonalService - filtros", () => {

    it("filtra por tipo y por estado", () => {
        const { personalService } = crearContexto();

        return personalService.crear(datosBase())
            .then(() => personalService.crear(datosBase({
                documento: "30999888", tipo: TIPOS_PERSONAL.LIMPIEZA, nombre: "Raúl",
            })))
            .then((limpieza) => personalService.cambiarEstado(limpieza.id, false))
            .then(() => personalService.obtenerTodos({ tipo: TIPOS_PERSONAL.LIMPIEZA }))
            .then((deLimpieza) => {
                expect(deLimpieza).toHaveLength(1);
                expect(deLimpieza[0].nombre).toBe("Raúl");
                return personalService.obtenerTodos({ activo: true });
            })
            .then((activos) => {
                expect(activos).toHaveLength(1);
                expect(activos[0].tipo).toBe(TIPOS_PERSONAL.ADMINISTRACION);
            });
    });
});

describe("PersonalService - modificación y baja", () => {

    it("actualiza solo los campos enviados", () => {
        const { personalService } = crearContexto();

        return personalService.crear(datosBase())
            .then((personal) => personalService.actualizar(personal.id, { telefono: "1199998888" }))
            .then((actualizado) => {
                expect(actualizado.telefono).toBe("1199998888");
                expect(actualizado.nombre).toBe("Lucía");
                expect(actualizado.documento).toBe("30111222");
            });
    });

    it("no deja pisar el documento de otro empleado", () => {
        const { personalService } = crearContexto();

        return personalService.crear(datosBase())
            .then(() => personalService.crear(datosBase({ documento: "30999888" })))
            .then((segundo) => personalService.actualizar(segundo.id, { documento: "30111222" }))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/ya existe personal/i));
    });

    it("permite reenviar el propio documento sin conflicto", () => {
        const { personalService } = crearContexto();

        return personalService.crear(datosBase())
            .then((personal) => personalService.actualizar(personal.id, {
                documento: "30111222", nombre: "Lucia María",
            }))
            .then((actualizado) => expect(actualizado.nombre).toBe("Lucia María"));
    });

    it("la baja lógica conserva el legajo y registra la fecha de baja", () => {
        const { personalService } = crearContexto();

        return personalService.crear(datosBase())
            .then((personal) => personalService.cambiarEstado(personal.id, false))
            .then((dadoDeBaja) => {
                expect(dadoDeBaja.activo).toBe(false);
                expect(dadoDeBaja.fechaBaja).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                return personalService.obtenerPorId(dadoDeBaja.id);
            })
            .then((persistido) => expect(persistido).not.toBeNull());
    });

    it("reactivar limpia la fecha de baja", () => {
        const { personalService } = crearContexto();

        return personalService.crear(datosBase())
            .then((personal) => personalService.cambiarEstado(personal.id, false)
                .then(() => personalService.cambiarEstado(personal.id, true)))
            .then((reactivado) => {
                expect(reactivado.activo).toBe(true);
                expect(reactivado.fechaBaja).toBeNull();
            });
    });

    it("rechaza dar de baja a alguien que ya está inactivo", () => {
        const { personalService } = crearContexto();

        return personalService.crear(datosBase())
            .then((personal) => personalService.cambiarEstado(personal.id, false)
                .then(() => personalService.cambiarEstado(personal.id, false)))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/ya se encuentra/i));
    });

    it("rechaza operar sobre un id inexistente", () => {
        const { personalService } = crearContexto();

        return personalService.obtenerPorId(404)
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/no encontrado/i));
    });
});
