import { Router } from "express";
import { MedicoController }      from "../controllers/MedicoController.js";
import { MedicoService }         from "../services/MedicoService.js";
import { MedicoRepository }      from "../repositories/MedicoRepository.js";
import { TurnoRepository }       from "../repositories/TurnoRepository.js";
import { sedeService }           from "./sedeRoutes.js";
import { notificacionController } from "./notificacionRoutes.js";
import { USUARIO_TIPOS }          from "../domain/Notificacion.js";
import { requireOwnership, requireAdmin } from "../middleware/authMiddleware.js";

// El médico solo puede operar sobre su propia agenda (el :id debe ser el suyo).
const soloMedico = requireOwnership(USUARIO_TIPOS.MEDICO);

const medicoRouter = Router();

export const medicoRepository = new MedicoRepository();
export const turnoRepository  = new TurnoRepository();

// turnoService se inyecta desde turnoRoutes para resolver la dependencia circular
export const medicoService = new MedicoService({ medicoRepository, sedeService });
// turnoService se inyecta después desde turnoRoutes para romper la dependencia circular.

const medicoController = new MedicoController({ medicoService });

// CRUD médico
medicoRouter.route("/")
    .get(medicoController.obtenerTodos)
    .post(medicoController.crearMedico);

medicoRouter.route("/:id")
    .get(medicoController.obtenerMedico)
    .delete(medicoController.eliminarMedico);

// Reset de contraseña — solo admin.
medicoRouter.route("/:id/password")
    .patch(requireAdmin, medicoController.resetearPassword);

// Slots disponibles — debe ir ANTES de /:id/disponibilidad/:disponibilidadId
// para que "slots" no se interprete como un disponibilidadId
medicoRouter.route("/:id/disponibilidad/slots")
    .get(medicoController.consultarSlotsDisponibles);

// Disponibilidad general
medicoRouter.route("/:id/disponibilidad")
    .get(medicoController.obtenerDisponibilidad)
    .post(medicoController.definirDisponibilidad)
    .put(medicoController.cambiarDisponibilidad);

medicoRouter.route("/:id/disponibilidad/:disponibilidadId")
    .get(medicoController.obtenerDisponibilidadPorId)
    .delete(medicoController.eliminarDisponibilidadPorId);

// Turnos confirmados del médico
medicoRouter.route("/:id/turnos")
    .get(soloMedico, medicoController.obtenerTurnosConfirmados);

// Operaciones sobre turnos del médico
medicoRouter.route("/:id/turnos/:turnoId/cancelar")
    .patch(soloMedico, medicoController.cancelarTurno);

medicoRouter.route("/:id/turnos/:turnoId/realizado")
    .patch(soloMedico, medicoController.marcarTurnoRealizado);

medicoRouter.route("/:id/turnos/:turnoId/proponer-cambio")
    .post(soloMedico, medicoController.proponerCambioFecha);

medicoRouter.route("/:id/turnos/:turnoId/confirmar-cambio")
    .patch(soloMedico, medicoController.confirmarCambioPaciente);

medicoRouter.route("/:id/turnos/:turnoId/rechazar-cambio")
    .patch(soloMedico, medicoController.rechazarCambioPaciente);

// Historial de paciente visto por el médico
medicoRouter.route("/:id/pacientes/:pacienteId/turnos")
    .get(soloMedico, medicoController.historialTurnosDePaciente);

// Gestión de sedes del médico
medicoRouter.route("/:id/sedes/:sedeId")
    .post(medicoController.asignarSede)
    .delete(medicoController.quitarSede);

// Gestión de especialidades
medicoRouter.route("/:id/especialidades")
    .post(medicoController.agregarEspecialidad);

medicoRouter.route("/:id/especialidades/:espId")
    .put(medicoController.modificarEspecialidad)
    .delete(medicoController.eliminarEspecialidad);

// Gestión de prácticas
medicoRouter.route("/:id/practicas")
    .post(medicoController.agregarPractica);

medicoRouter.route("/:id/practicas/:practicaId")
    .put(medicoController.modificarPractica)
    .delete(medicoController.eliminarPractica);

// Notificaciones — REST: recurso anidado bajo el médico
medicoRouter.route("/:id/notificaciones")
    .get(soloMedico, notificacionController.obtenerNotificaciones(USUARIO_TIPOS.MEDICO));

medicoRouter.route("/:id/notificaciones/:notificacionId")
    .patch(soloMedico, notificacionController.marcarLeida(USUARIO_TIPOS.MEDICO));

export default medicoRouter;
