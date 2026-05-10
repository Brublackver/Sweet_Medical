/*
    CONTROLLER — Capa de entrada HTTP para Notificaciones

    Traduce los query params y route params a llamadas al NotificacionService.
    No contiene lógica de negocio.
*/

import { validarId } from "../validators/pacienteValidator.js";

export class NotificacionController {
    constructor({ notificacionService } = {}) {
        this.notificacionService = notificacionService;
    }

    // GET /notificaciones/:usuarioId/sin-leer
    // Retorna las notificaciones pendientes de lectura del usuario.
    obtenerSinLeer = (req, res, next) =>
        validarId(req.params.usuarioId)
            .then((usuarioId) => this.notificacionService.obtenerSinLeer(usuarioId))
            .then((notificaciones) => res.status(200).json({ status: "success", data: notificaciones }))
            .catch(next);

    // GET /notificaciones/:usuarioId/leidas
    // Retorna el historial de notificaciones ya leídas del usuario.
    obtenerLeidas = (req, res, next) =>
        validarId(req.params.usuarioId)
            .then((usuarioId) => this.notificacionService.obtenerLeidas(usuarioId))
            .then((notificaciones) => res.status(200).json({ status: "success", data: notificaciones }))
            .catch(next);

    // PATCH /notificaciones/:id/leer
    // Marca una notificación específica como leída.
    marcarLeida = (req, res, next) =>
        validarId(req.params.id)
            .then((id) => this.notificacionService.marcarLeida(id))
            .then((notificacion) => res.status(200).json({ status: "success", data: notificacion }))
            .catch(next);
}
