/*
    ROUTES — Define las rutas HTTP para el recurso Médico

    Endpoints de disponibilidad:
      GET    /medico/:id/disponibilidad                     → general o por fecha (?fecha=)
      POST   /medico/:id/disponibilidad                     → definir
      PUT    /medico/:id/disponibilidad                     → cambiar
      GET    /medico/:id/disponibilidad/slots               → slots libres (?fecha=&duracion=&especialidad=&practica=)
      GET    /medico/:id/disponibilidad/:disponibilidadId   → por id
      DELETE /medico/:id/disponibilidad/:disponibilidadId   → eliminar

    Endpoints de turnos:
      PATCH  /medico/:id/turnos/:turnoId/cancelar           → cancelar con motivo
      PATCH  /medico/:id/turnos/:turnoId/realizado          → marcar como realizado
      POST   /medico/:id/turnos/:turnoId/proponer-cambio    → proponer nueva fecha
      PATCH  /medico/:id/turnos/:turnoId/confirmar-cambio   → confirmar solicitud del paciente
      PATCH  /medico/:id/turnos/:turnoId/rechazar-cambio    → rechazar solicitud del paciente
      GET    /medico/:id/pacientes/:pacienteId/turnos       → historial de un paciente
*/

import { Router } from "express";
import { MedicoController } from "../controllers/MedicoController.js";
import { MedicoService }    from "../services/MedicoService.js";
import { MedicoRepository } from "../repositories/MedicoRepository.js";
import { TurnoRepository }  from "../repositories/TurnoRepository.js";

const medicoRouter = Router();

export const medicoRepository = new MedicoRepository();
export const turnoRepository  = new TurnoRepository();

// turnoService se inyecta desde turnoRoutes para resolver la dependencia circular
export const medicoService = new MedicoService({ medicoRepository });

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

export default medicoRouter;
