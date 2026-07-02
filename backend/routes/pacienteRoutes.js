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
import { notificacionController } from "./notificacionRoutes.js";
import { USUARIO_TIPOS }      from "../domain/Notificacion.js";
import { requireOwnership, requireAdmin, requireAdminOrOwnership } from "../middleware/authMiddleware.js";

const pacienteRouter          = new Router();
export const pacienteRepository = new PacienteRepository();
export const pacienteService = new PacienteService({ pacienteRepository, turnoService });
const pacienteController = new PacienteController({ pacienteService });

// El paciente solo puede operar sobre su propia cuenta (el :id debe ser el suyo).
const soloPaciente = requireOwnership(USUARIO_TIPOS.PACIENTE);
// Ver el perfil: el admin o el propio paciente.
const adminOPaciente = requireAdminOrOwnership(USUARIO_TIPOS.PACIENTE);

// Listar y crear pacientes son operaciones de administración.
pacienteRouter.route("/")
    .get(requireAdmin, pacienteController.obtenerTodos)
    .post(requireAdmin, pacienteController.crearPaciente);

pacienteRouter.route("/:id")
    .get(adminOPaciente, pacienteController.obtenerPaciente)
    .delete(requireAdmin, pacienteController.eliminarPaciente);

// Reset de contraseña — solo admin.
pacienteRouter.route("/:id/password")
    .patch(requireAdmin, pacienteController.resetearPassword);

pacienteRouter.route("/:id/turno")
    .post(soloPaciente, pacienteController.reservarTurno);

pacienteRouter.route("/:id/turnos")
    .get(soloPaciente, pacienteController.obtenerHistorial);

pacienteRouter.route("/:id/turnos/:turnoId/cancelar")
    .patch(soloPaciente, pacienteController.cancelarTurno);

pacienteRouter.route("/:id/turnos/:turnoId/solicitar-cambio")
    .post(soloPaciente, pacienteController.solicitarCambioFecha);

pacienteRouter.route("/:id/turnos/:turnoId/confirmar-propuesta")
    .patch(soloPaciente, pacienteController.confirmarPropuestaMedico);

pacienteRouter.route("/:id/turnos/:turnoId/rechazar-propuesta")
    .patch(soloPaciente, pacienteController.rechazarPropuestaMedico);

// Desenlace del turno una vez pasado: el paciente confirma o niega la atención.
pacienteRouter.route("/:id/turnos/:turnoId/confirmar-atencion")
    .patch(soloPaciente, pacienteController.confirmarAtencion);

pacienteRouter.route("/:id/turnos/:turnoId/no-atencion")
    .patch(soloPaciente, pacienteController.reportarNoAtencion);

// Coberturas del plan — las gestiona el admin.
pacienteRouter.route("/:id/plan/especialidades")
    .post(requireAdmin, pacienteController.agregarCoberturaEspecialidad);

pacienteRouter.route("/:id/plan/especialidades/:codigo")
    .delete(requireAdmin, pacienteController.quitarCoberturaEspecialidad);

pacienteRouter.route("/:id/plan/practicas")
    .post(requireAdmin, pacienteController.agregarCoberturaPractica);

pacienteRouter.route("/:id/plan/practicas/:codigo")
    .delete(requireAdmin, pacienteController.quitarCoberturaPractica);

// Notificaciones — REST: recurso anidado bajo el paciente
pacienteRouter.route("/:id/notificaciones")
    .get(soloPaciente, notificacionController.obtenerNotificaciones(USUARIO_TIPOS.PACIENTE));

pacienteRouter.route("/:id/notificaciones/:notificacionId")
    .patch(soloPaciente, notificacionController.marcarLeida(USUARIO_TIPOS.PACIENTE));

export default pacienteRouter;
