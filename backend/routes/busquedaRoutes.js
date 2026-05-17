import { Router }              from "express";
import { BusquedaController }  from "../controllers/BusquedaController.js";
import { BusquedaService }     from "../services/BusquedaService.js";
import { medicoService }       from "./medicoRoutes.js";
import { turnoService }        from "./turnoRoutes.js";
import { pacienteService }     from "./pacienteRoutes.js";

const busquedaRouter = Router();

const busquedaService    = new BusquedaService({ medicoService, turnoService, pacienteService });
const busquedaController = new BusquedaController({ busquedaService });

busquedaRouter.route("/buscar")
    .get(busquedaController.buscar);

export default busquedaRouter;
