import { Router } from "express";
import { MedicoController } from "../controllers/MedicoController.js";
import { MedicoService }    from "../services/MedicoService.js";
import { MedicoRepository } from "../repositories/MedicoRepository.js";
import { TurnoRepository }  from "../repositories/TurnoRepository.js";
import { sedeService }      from "./sedeRoutes.js";

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
    .get(medicoController.obtenerMedico);

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
    .get(medicoController.obtenerTurnosConfirmados);

// Operaciones sobre turnos del médico
medicoRouter.route("/:id/turnos/:turnoId/cancelar")
    .patch(medicoController.cancelarTurno);

medicoRouter.route("/:id/turnos/:turnoId/realizado")
    .patch(medicoController.marcarTurnoRealizado);

medicoRouter.route("/:id/turnos/:turnoId/proponer-cambio")
    .post(medicoController.proponerCambioFecha);

medicoRouter.route("/:id/turnos/:turnoId/confirmar-cambio")
    .patch(medicoController.confirmarCambioPaciente);

medicoRouter.route("/:id/turnos/:turnoId/rechazar-cambio")
    .patch(medicoController.rechazarCambioPaciente);

// Historial de paciente visto por el médico
medicoRouter.route("/:id/pacientes/:pacienteId/turnos")
    .get(medicoController.historialTurnosDePaciente);

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

export default medicoRouter;
