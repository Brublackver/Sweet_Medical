/*
    Exporta las instancias de notificación para inyección de dependencias.
    Las rutas HTTP viven en medicoRoutes bajo /:id/notificaciones.
*/

import { NotificacionController } from "../controllers/NotificacionController.js";
import { NotificacionService }    from "../services/NotificacionService.js";
import { NotificacionRepository } from "../repositories/NotificacionRepository.js";

export const notificacionRepository = new NotificacionRepository();
export const notificacionService    = new NotificacionService({ notificacionRepository });
export const notificacionController = new NotificacionController({ notificacionService });
