import { Router }              from "express";
import { ObraSocialController } from "../controllers/ObraSocialController.js";
import { ObraSocialService }    from "../services/ObraSocialService.js";
import { ObraSocialRepository } from "../repositories/ObraSocialRepository.js";

const obraSocialRouter = Router();

export const obraSocialRepository = new ObraSocialRepository();
export const obraSocialService    = new ObraSocialService({ obraSocialRepository });

const obraSocialController = new ObraSocialController({ obraSocialService });

obraSocialRouter.route("/")
    .get(obraSocialController.obtenerTodas);

export default obraSocialRouter;
