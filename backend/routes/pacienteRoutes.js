/*
    ROUTES — Define las rutas HTTP para el recurso Paciente

    Endpoints:
      GET    /paciente                              → listar todos
      POST   /paciente                              → crear paciente
      GET    /paciente/:id                          → obtener paciente por id
      POST   /paciente/:id/turno                   → reservar turno
      GET    /paciente/:id/turnos                  → historial de turnos
      PATCH  /paciente/:id/turnos/:turnoId/cancelar        → cancelar con motivo
      POST   /paciente/:id/turnos/:turnoId/solicitar-cambio → solicitar cambio de fecha
*/

import { Router } from "express";
import { PacienteController } from "../controllers/PacienteController.js";
import { PacienteService }    from "../services/PacienteService.js";
import { PacienteRepository } from "../repositories/PacienteRepository.js";
import { turnoService }       from "./turnoRoutes.js";

const pacienteRouter          = new Router();
export const pacienteRepository = new PacienteRepository();
export const pacienteService = new PacienteService({ pacienteRepository, turnoService });
const pacienteController = new PacienteController({ pacienteService });

pacienteRouter.route("/")
    .get(pacienteController.obtenerTodos)
    .post(pacienteController.crearPaciente);

pacienteRouter.route("/:id")
    .get(pacienteController.obtenerPaciente)
    .delete(pacienteController.eliminarPaciente);

pacienteRouter.route("/:id/turno")
    .post(pacienteController.reservarTurno);

pacienteRouter.route("/:id/turnos")
    .get(pacienteController.obtenerHistorial);

pacienteRouter.route("/:id/turnos/:turnoId/cancelar")
    .patch(pacienteController.cancelarTurno);

pacienteRouter.route("/:id/turnos/:turnoId/solicitar-cambio")
    .post(pacienteController.solicitarCambioFecha);

pacienteRouter.route("/:id/turnos/:turnoId/confirmar-propuesta")
    .patch(pacienteController.confirmarPropuestaMedico);

pacienteRouter.route("/:id/turnos/:turnoId/rechazar-propuesta")
    .patch(pacienteController.rechazarPropuestaMedico);

export default pacienteRouter;
