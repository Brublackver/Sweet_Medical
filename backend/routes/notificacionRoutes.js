/*
    ROUTES — Define las rutas HTTP para Notificaciones

    Endpoints:
      GET   /notificaciones/:usuarioId/sin-leer  → notificaciones sin leer del usuario
      GET   /notificaciones/:usuarioId/leidas     → notificaciones leídas del usuario
      PATCH /notificaciones/:id/leer              → marcar notificación como leída
*/

import { Router }                    from "express";
import { NotificacionController }    from "../controllers/NotificacionController.js";
import { NotificacionService }       from "../services/NotificacionService.js";
import { NotificacionRepository }    from "../repositories/NotificacionRepository.js";

const notificacionRouter = Router();

export const notificacionRepository = new NotificacionRepository();
export const notificacionService    = new NotificacionService({ notificacionRepository });

const notificacionController = new NotificacionController({ notificacionService });

notificacionRouter.route("/:usuarioId/sin-leer")
    .get(notificacionController.obtenerSinLeer);

notificacionRouter.route("/:usuarioId/leidas")
    .get(notificacionController.obtenerLeidas);

notificacionRouter.route("/:id/leer")
    .patch(notificacionController.marcarLeida);

export default notificacionRouter;
