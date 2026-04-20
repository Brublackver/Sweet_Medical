/*
    ROUTES — Define las rutas HTTP para el recurso Turno
    Conecta cada verbo HTTP + path con el metodo correspondiente del TurnoController.
    No contiene logica, solo mapeo de rutas.

    Importa el medicoRepository compartido para que el TurnoService
    pueda verificar la disponibilidad del medico al crear un turno.
*/

import { Router } from "express";
import { TurnoController } from "../controllers/TurnoController.js";
import { TurnoService } from "../services/TurnoService.js";
import { medicoRepository, turnoRepository } from "./medicoRoutes.js";

const turnoRouter = Router();
const turnoService = new TurnoService({ turnoRepository, medicoRepository });
const turnoController = new TurnoController({ turnoService });

// CRUD de turnos
turnoRouter.get("/", turnoController.obtenerTodos);
turnoRouter.post("/", turnoController.crearTurno);
turnoRouter.delete("/:id", turnoController.cancelarTurno);

export default turnoRouter;
