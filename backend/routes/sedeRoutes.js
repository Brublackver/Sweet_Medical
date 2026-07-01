import { Router }          from "express";
import { SedeController }  from "../controllers/SedeController.js";
import { SedeService }     from "../services/SedeService.js";
import { SedeRepository }  from "../repositories/SedeRepository.js";
import { requireAdmin }    from "../middleware/authMiddleware.js";

const sedeRouter = Router();

export const sedeRepository = new SedeRepository();
export const sedeService    = new SedeService({ sedeRepository });

const sedeController = new SedeController({ sedeService });

sedeRouter.route("/")
    .get(sedeController.obtenerTodas)
    .post(requireAdmin, sedeController.crearSede);

export default sedeRouter;
