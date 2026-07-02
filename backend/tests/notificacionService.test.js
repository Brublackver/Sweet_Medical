import { describe, it, expect }         from "@jest/globals";
import { NotificacionService }          from "../services/NotificacionService.js";
import { FakeNotificacionRepository }   from "./fakes/FakeNotificacionRepository.js";
import { USUARIO_TIPOS, TIPOS_NOTIFICACION } from "../domain/Notificacion.js";

const crearContexto = () => {
    const notificacionRepository = new FakeNotificacionRepository();
    const notificacionService    = new NotificacionService({ notificacionRepository });
    return { notificacionRepository, notificacionService };
};

describe("NotificacionService - clave compuesta (usuarioTipo, usuarioId)", () => {

    it("no mezcla las notificaciones de médico 1 y paciente 1 (mismo id, distinto tipo)", () => {
        const { notificacionService } = crearContexto();

        return Promise.all([
            notificacionService.crear(USUARIO_TIPOS.MEDICO,   1, TIPOS_NOTIFICACION.TURNO_CANCELADO, "para el médico"),
            notificacionService.crear(USUARIO_TIPOS.PACIENTE, 1, TIPOS_NOTIFICACION.TURNO_CANCELADO, "para el paciente"),
        ])
            .then(() => notificacionService.obtenerPara(USUARIO_TIPOS.MEDICO, 1))
            .then((notificaciones) => {
                expect(notificaciones).toHaveLength(1);
                expect(notificaciones[0].mensaje).toBe("para el médico");
            });
    });

    it("marcarLeida rechaza si la notificación no pertenece al usuario", () => {
        const { notificacionService } = crearContexto();

        return notificacionService
            .crear(USUARIO_TIPOS.PACIENTE, 5, TIPOS_NOTIFICACION.TURNO_CANCELADO, "x")
            .then((n) => notificacionService.marcarLeida(USUARIO_TIPOS.MEDICO, 5, n.id))
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/no pertenece/i));
    });

    it("filtra sólo las no leídas cuando se pide leida=false", () => {
        const { notificacionService } = crearContexto();

        return notificacionService
            .crear(USUARIO_TIPOS.MEDICO, 2, TIPOS_NOTIFICACION.TURNO_CANCELADO, "leída")
            .then((n) => notificacionService.marcarLeida(USUARIO_TIPOS.MEDICO, 2, n.id))
            .then(() => notificacionService.crear(USUARIO_TIPOS.MEDICO, 2, TIPOS_NOTIFICACION.TURNO_CANCELADO, "sin leer"))
            .then(() => notificacionService.obtenerPara(USUARIO_TIPOS.MEDICO, 2, false))
            .then((sinLeer) => {
                expect(sinLeer).toHaveLength(1);
                expect(sinLeer[0].mensaje).toBe("sin leer");
            });
    });
});
