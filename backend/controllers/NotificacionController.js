import { validarIdNumerico } from "../validators/pacienteValidator.js";
import { BadRequestError }   from "../errors/AppError.js";

export class NotificacionController {
    constructor({ notificacionService } = {}) {
        this.notificacionService = notificacionService;
    }

    // GET /medico/:id/notificaciones
    // GET /medico/:id/notificaciones?leidas=true
    // GET /medico/:id/notificaciones?leidas=false
    obtenerNotificaciones = (req, res, next) => {
        const { leidas } = req.query;
        const leida = leidas === undefined ? undefined : leidas === "true";
        return validarIdNumerico(req.params.id)
            .then((medicoId) => this.notificacionService.obtenerPorMedico(medicoId, leida))
            .then((notificaciones) => res.status(200).json({ status: "success", data: notificaciones }))
            .catch(next);
    };

    // PATCH /medico/:id/notificaciones/:notificacionId  — body: { leida: true }
    marcarLeida = (req, res, next) => {
        if (req.body.leida !== true)
            return next(new BadRequestError("El body debe contener { leida: true }"));
        return Promise.all([
            validarIdNumerico(req.params.id),
            validarIdNumerico(req.params.notificacionId),
        ])
            .then(([medicoId, notificacionId]) =>
                this.notificacionService.marcarLeida(medicoId, notificacionId)
            )
            .then((notificacion) => res.status(200).json({ status: "success", data: notificacion }))
            .catch(next);
    };
}
