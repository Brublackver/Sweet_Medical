/*
    ROUTES — Define las rutas HTTP para el recurso Turno

    Exporta turnoService para que pacienteRoutes y medicoRoutes
    puedan compartir la misma instancia (única fuente de verdad de los turnos).

    Resuelve la dependencia circular: TurnoService necesita medicoService y
    MedicoService necesita turnoService. Se crea turnoService con medicoService
    y luego se inyecta turnoService en medicoService.
*/

import { Router } from "express";
import { TurnoController }   from "../controllers/TurnoController.js";
import { TurnoService }      from "../services/TurnoService.js";
import { medicoRepository, turnoRepository, medicoService } from "./medicoRoutes.js";
import { notificacionService } from "./notificacionRoutes.js";

const turnoRouter = Router();

export const turnoService = new TurnoService({ turnoRepository, medicoService, notificacionService });
medicoService.setTurnoService(turnoService);

const turnoController = new TurnoController({ turnoService });

turnoRouter.route("/")
    .get(turnoController.obtenerTodos)
    .post(turnoController.crearTurno);

export default turnoRouter;
