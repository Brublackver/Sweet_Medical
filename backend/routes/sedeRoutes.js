import { Router }          from "express";
import { SedeController }  from "../controllers/SedeController.js";
import { SedeService }     from "../services/SedeService.js";
import { SedeRepository }  from "../repositories/SedeRepository.js";

const sedeRouter = Router();

export const sedeRepository = new SedeRepository();
export const sedeService    = new SedeService({ sedeRepository });

const sedeController = new SedeController({ sedeService });

sedeRouter.route("/")
    .get(sedeController.obtenerTodas)
    .post(sedeController.crearSede);

export default sedeRouter;
