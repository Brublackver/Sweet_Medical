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
import { PacienteRepository } from "../repositories/PacienteRepository.js";
import { medicoRepository, turnoRepository, medicoService } from "./medicoRoutes.js";
import { notificacionService } from "./notificacionRoutes.js";
import { avisoDisponibilidadService } from "./avisoDisponibilidadRoutes.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const turnoRouter = Router();
const pacienteRepository = new PacienteRepository();

export const turnoService = new TurnoService({
    turnoRepository, medicoService, pacienteRepository, notificacionService, avisoDisponibilidadService,
});
medicoService.setTurnoService(turnoService);

const turnoController = new TurnoController({ turnoService });

// CRUD directo de turnos: solo administración. Los pacientes reservan por
// POST /paciente/:id/turno (que toma el pacienteId del token, no del body).
turnoRouter.route("/")
    .get(requireAdmin, turnoController.obtenerTodos)
    .post(requireAdmin, turnoController.crearTurno);

export default turnoRouter;
