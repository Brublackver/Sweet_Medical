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
import { DisponibilidadHoraria } from "../domain/DisponibilidadHorario.js";

const medicoRouter = Router();

// Instancias compartidas — se exportan para que TurnoService use los mismos datos
export const medicoRepository = new MedicoRepository()
export const turnoRepository = new TurnoRepository()

const disponibilidadHoraria = new DisponibilidadHoraria()

const medicoService = new MedicoService({ medicoRepository, turnoRepository, disponibilidadHoraria });

const medicoController = new MedicoController({ medicoService });

// CRUD de medicos
medicoRouter.route ('/')
.get(medicoController.obtenerTodos)
.post(medicoController.crearMedico);

medicoRouter.route ('/:id')
.get(medicoController.obtenerMedico);

medicoRouter.route ('/:id/disponibilidad')
    .get(medicoController.obtenerDisponibilidad)
    .post( medicoController.definirDisponibilidad)
    .put(medicoController.cambiarDisponibilidad)
    .delete(medicoController.eliminarDisponibilidad); // modificar mas adelante para eliminar una disp en especifico, no todas

export default medicoRouter;