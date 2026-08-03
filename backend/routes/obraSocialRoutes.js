import { Router }              from "express";
import { ObraSocialController } from "../controllers/ObraSocialController.js";
import { ObraSocialService }    from "../services/ObraSocialService.js";
import { ObraSocialRepository } from "../repositories/ObraSocialRepository.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const obraSocialRouter = Router();

export const obraSocialRepository = new ObraSocialRepository();
export const obraSocialService    = new ObraSocialService({ obraSocialRepository });

const obraSocialController = new ObraSocialController({ obraSocialService });

/*
    OJO — este router se monta ANTES de requireAuth (ver router.js): el catálogo
    tiene que ser público porque el registro de un paciente lo necesita cuando
    todavía no hay token. Por eso las escrituras piden requireAuth explícitamente
    además de requireAdmin: sin el primero, req.user vendría vacío y requireAdmin
    respondería 401 en lugar de validar de verdad.
*/
const soloAdmin = [requireAuth, requireAdmin];

obraSocialRouter.route("/")
    .get(obraSocialController.obtenerTodas)
    .post(soloAdmin, obraSocialController.crear);

obraSocialRouter.route("/:id")
    .get(obraSocialController.obtenerPorId);

// Alta/baja de la obra social en el catálogo.
obraSocialRouter.route("/:id/estado")
    .patch(soloAdmin, obraSocialController.cambiarEstado);

// Suscripción: consulta pública del estado, gestión reservada al admin.
obraSocialRouter.route("/:id/suscripcion")
    .get(obraSocialController.consultarEstado)
    .put(soloAdmin, obraSocialController.registrarSuscripcion);

obraSocialRouter.route("/:id/suscripcion/estado")
    .patch(soloAdmin, obraSocialController.cambiarEstadoSuscripcion);

export default obraSocialRouter;
