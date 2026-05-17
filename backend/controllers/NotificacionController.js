import { validarId, validarIdNumerico } from "../validators/pacienteValidator.js";

export class NotificacionController {
    constructor({ notificacionService } = {}) {
        this.notificacionService = notificacionService;
    }

    obtenerSinLeer = (req, res, next) =>
        validarIdNumerico(req.params.usuarioId)
            .then((usuarioId) => this.notificacionService.obtenerSinLeer(usuarioId))
            .then((notificaciones) => res.status(200).json({ status: "success", data: notificaciones }))
            .catch(next);

    obtenerLeidas = (req, res, next) =>
        validarIdNumerico(req.params.usuarioId)
            .then((usuarioId) => this.notificacionService.obtenerLeidas(usuarioId))
            .then((notificaciones) => res.status(200).json({ status: "success", data: notificaciones }))
            .catch(next);

    marcarLeida = (req, res, next) =>
        validarId(req.params.id)
            .then((id) => this.notificacionService.marcarLeida(id))
            .then((notificacion) => res.status(200).json({ status: "success", data: notificacion }))
            .catch(next);
}
