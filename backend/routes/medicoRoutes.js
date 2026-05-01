/*
    ROUTES — Define las rutas HTTP para el recurso Medico
    Conecta cada verbo HTTP + path con el metodo correspondiente del MedicoController.
    No contiene logica, solo mapeo de rutas.

    Exporta medicoRepository, turnoRepository y medicoService para que turnoRoutes
    pueda compartir las mismas instancias y resolver la dependencia circular.
*/

import { Router } from "express";
import { MedicoController } from "../controllers/MedicoController.js";
import { MedicoService } from "../services/MedicoService.js";
import { MedicoRepository } from "../repositories/MedicoRepository.js";
import { TurnoRepository } from "../repositories/TurnoRepository.js";

const medicoRouter = Router();

export const medicoRepository = new MedicoRepository();
export const turnoRepository = new TurnoRepository();

// turnoService se asigna desde turnoRoutes despues de crearlo
export const medicoService = new MedicoService({ medicoRepository });

const medicoController = new MedicoController({ medicoService });

medicoRouter.route("/")
    .get(medicoController.obtenerTodos)
    .post(medicoController.crearMedico);

medicoRouter.route("/:id")
    .get(medicoController.obtenerMedico);

medicoRouter.route("/:id/disponibilidad")
    .get(medicoController.obtenerDisponibilidad)
    .post(medicoController.definirDisponibilidad)
    .put(medicoController.cambiarDisponibilidad);

medicoRouter.route("/:id/disponibilidad/:disponibilidadId")
    .get(medicoController.obtenerDisponibilidadPorId)
    .delete(medicoController.eliminarDisponibilidadPorId);

export default medicoRouter;
