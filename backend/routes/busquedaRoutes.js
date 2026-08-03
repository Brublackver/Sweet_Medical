import { Router }              from "express";
import { BusquedaController }  from "../controllers/BusquedaController.js";
import { BusquedaService }     from "../services/BusquedaService.js";
import { medicoService }       from "./medicoRoutes.js";
import { turnoService }        from "./turnoRoutes.js";
import { pacienteService }     from "./pacienteRoutes.js";
import { avisoDisponibilidadService } from "./avisoDisponibilidadRoutes.js";

const busquedaRouter = Router();

export const busquedaService = new BusquedaService({ medicoService, turnoService, pacienteService });
const busquedaController     = new BusquedaController({ busquedaService });

// La fila de espera evalúa sus avisos corriendo la MISMA búsqueda que el paciente.
// Se inyecta acá (por setter) y no en el constructor del servicio: busquedaService
// depende de médicos/turnos/pacientes, así que pedirlo antes crearía un ciclo.
avisoDisponibilidadService.setBusquedaService(busquedaService);

busquedaRouter.route("/buscar")
    .get(busquedaController.buscar);

export default busquedaRouter;
