/*
    ROUTES — Define las rutas HTTP para el recurso Medico
    Conecta cada verbo HTTP + path con el metodo correspondiente del MedicoController.
    No contiene logica, solo mapeo de rutas.

    Exporta el medicoRepository para que otros modulos (turnoRoutes)
    puedan compartir la misma instancia y acceder a los mismos medicos.
*/

import { Router } from "express";
import { MedicoController } from "../controllers/MedicoController.js";
import { MedicoService } from "../services/MedicoService.js";
import { MedicoRepository } from "../repositories/MedicoRepository.js";
import { TurnoRepository } from "../repositories/TurnoRepository.js";

const medicoRouter = Router();

// Instancias compartidas — se exportan para que TurnoService use los mismos datos
export const medicoRepository = new MedicoRepository()
export const turnoRepository = new TurnoRepository()

const medicoService = new MedicoService({ medicoRepository, turnoRepository });

const medicoController = new MedicoController({ medicoService });

// CRUD de medicos
medicoRouter.get("/", medicoController.obtenerTodos);
medicoRouter.get("/:id", medicoController.obtenerMedico);
medicoRouter.post("/", medicoController.crearMedico);

// CRUD de disponibilidad de un medico
medicoRouter.get("/:id/disponibilidad", medicoController.obtenerDisponibilidad);
medicoRouter.post("/:id/disponibilidad", medicoController.definirDisponibilidad);
medicoRouter.put("/:id/disponibilidad", medicoController.cambiarDisponibilidad);
medicoRouter.delete("/:id/disponibilidad", medicoController.eliminarDisponibilidad);

export default medicoRouter;