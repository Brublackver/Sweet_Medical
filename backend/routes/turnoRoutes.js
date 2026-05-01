/*
    ROUTES — Define las rutas HTTP para el recurso Turno
    Conecta cada verbo HTTP + path con el metodo correspondiente del TurnoController.
    No contiene logica, solo mapeo de rutas.

    Resuelve la dependencia circular: TurnoService necesita medicoService y
    MedicoService necesita turnoService. Se crea turnoService con medicoService
    y luego se inyecta turnoService en medicoService.
*/

import { Router } from "express";
import { TurnoController } from "../controllers/TurnoController.js";
import { TurnoService } from "../services/TurnoService.js";
import { medicoRepository, turnoRepository, medicoService } from "./medicoRoutes.js";

const turnoRouter = Router();

const turnoService = new TurnoService({ turnoRepository, medicoService });
medicoService.turnoService = turnoService;

const turnoController = new TurnoController({ turnoService });

turnoRouter.route("/")
    .get(turnoController.obtenerTodos)
    .post(turnoController.crearTurno);

turnoRouter.route("/:id")
    .delete(turnoController.cancelarTurno);

export default turnoRouter;
