/*
    ROUTES — Personal no médico (administración y limpieza)

    Endpoints (todos de administración):
      GET    /personal            → listar (?tipo=ADMINISTRACION&activo=true)
      GET    /personal/tipos      → catálogo de tipos disponibles
      POST   /personal            → alta
      GET    /personal/:id        → detalle
      PUT    /personal/:id        → modificación
      PATCH  /personal/:id/estado → baja/alta lógica { activo: true|false }
      DELETE /personal/:id        → borrado físico
*/

import { Router }               from "express";
import { PersonalController }   from "../controllers/PersonalController.js";
import { PersonalService }      from "../services/PersonalService.js";
import { PersonalRepository }   from "../repositories/PersonalRepository.js";
import { requireAdmin }         from "../middleware/authMiddleware.js";

const personalRouter = Router();

export const personalRepository = new PersonalRepository();
export const personalService    = new PersonalService({ personalRepository });

const personalController = new PersonalController({ personalService });

// El legajo del personal es información sensible de RRHH: todo el módulo es
// exclusivo del admin. El router ya se monta detrás de requireAuth (router.js).
personalRouter.use(requireAdmin);

// "tipos" tiene que ir ANTES de "/:id" para que no se interprete como un id.
personalRouter.route("/tipos")
    .get(personalController.obtenerTipos);

personalRouter.route("/")
    .get(personalController.obtenerTodos)
    .post(personalController.crear);

personalRouter.route("/:id")
    .get(personalController.obtenerPorId)
    .put(personalController.actualizar)
    .delete(personalController.eliminar);

personalRouter.route("/:id/estado")
    .patch(personalController.cambiarEstado);

export default personalRouter;
