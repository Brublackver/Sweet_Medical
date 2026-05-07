import { Router }              from "express";
import { BusquedaController }  from "../controllers/BusquedaController.js";
import { BusquedaService }     from "../services/BusquedaService.js";
import { medicoRepository, turnoRepository } from "./medicoRoutes.js";
import { pacienteRepository }  from "./pacienteRoutes.js";

const busquedaRouter = Router();

const busquedaService    = new BusquedaService({ medicoRepository, turnoRepository, pacienteRepository });
const busquedaController = new BusquedaController({ busquedaService });

busquedaRouter.route("/buscar")
    .get(busquedaController.buscar);

export default busquedaRouter;
