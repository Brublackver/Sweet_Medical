import { validarIdNumerico } from "../validators/pacienteValidator.js";
import { BadRequestError }   from "../errors/AppError.js";

/*
    CONTROLLER — Notificaciones

    Los handlers son fábricas parametrizadas por usuarioTipo ("MEDICO" | "PACIENTE"),
    de modo que la misma lógica sirve para las rutas anidadas bajo /medico/:id
    y bajo /paciente/:id sin duplicar código.
*/
export class NotificacionController {
    constructor({ notificacionService } = {}) {
        this.notificacionService = notificacionService;
    }

    // GET /:tipo/:id/notificaciones
    // GET /:tipo/:id/notificaciones?leidas=true|false
    obtenerNotificaciones = (usuarioTipo) => (req, res, next) => {
        const { leidas } = req.query;
        const leida = leidas === undefined ? undefined : leidas === "true";
        return validarIdNumerico(req.params.id)
            .then((usuarioId) => this.notificacionService.obtenerPara(usuarioTipo, usuarioId, leida))
            .then((notificaciones) => res.status(200).json({ status: "success", data: notificaciones }))
            .catch(next);
    };

    // PATCH /:tipo/:id/notificaciones/:notificacionId
    // body: { leida: true, resultado?: "ACEPTADO" | "RECHAZADO" }
    marcarLeida = (usuarioTipo) => (req, res, next) => {
        if (req.body.leida !== true)
            return next(new BadRequestError("El body debe contener { leida: true }"));
        const resultado = req.body.resultado === "ACEPTADO" || req.body.resultado === "RECHAZADO"
            ? req.body.resultado
            : null;
        return Promise.all([
            validarIdNumerico(req.params.id),
            validarIdNumerico(req.params.notificacionId),
        ])
            .then(([usuarioId, notificacionId]) =>
                this.notificacionService.marcarLeida(usuarioTipo, usuarioId, notificacionId, resultado)
            )
            .then((notificacion) => res.status(200).json({ status: "success", data: notificacion }))
            .catch(next);
    };
}
