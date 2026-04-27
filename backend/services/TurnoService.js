/*
    SERVICE — Capa de logica de negocio para Turnos
    Contiene las reglas de negocio:
    - Un turno solo se puede crear si el medico tiene disponibilidad ese dia/hora
    - Un turno solo se puede cancelar con al menos 1 hora de anticipacion
    - No se pueden crear turnos duplicados para el mismo medico y horario

    SERVICE --- DOMAIN
             |
         REPOSITORY
*/

import { TurnoRepository } from "../repositories/TurnoRepository.js";
import { MedicoRepository } from "../repositories/MedicoRepository.js";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../errors/AppError.js";

export class TurnoService {
  constructor({
    turnoRepository = new TurnoRepository(),
    medicoService = new MedicoService(),
  } = {}) {
    this.turnoRepository = turnoRepository;
    this.medicoService = medicoService;
  }

  // Devuelve todos los turnos → Promise<Turno[]>
  // Viene de: TurnoController.obtenerTodos()
  // Va hacia: TurnoRepository.obtenerTodos()
  obtenerTodos() {
    return this.turnoRepository.obtenerTodos();
  }

  // Crea un turno validando disponibilidad del medico y que no haya duplicados → Promise<Turno>
  // Viene de: TurnoController.crearTurno() con datos validados por Zod
  // Paso 1: Verifica que el medico exista en MedicoRepository
  // Paso 2: Verifica que el medico tenga disponibilidad en el dia/hora solicitado
  // Paso 3: Verifica que no exista un turno en el mismo horario para ese medico
  // Paso 4: Crea el turno en TurnoRepository
  crearTurno(datos) {
    const fechaTurno = new Date(datos.fecha + "T" + datos.hora + ":00");
    const diasSemana = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const diaSemana = diasSemana[fechaTurno.getDay()];
    const horaNum = fechaTurno.getHours();

    return this.medicoService
      .obtenerPorId(datos.medicoId)
      .then((medico) => {
        if (!medico) return Promise.reject(new NotFoundError("Medico no encontrado"));
        if (!medico.tieneDisponibilidad(diaSemana, horaNum)) {
          return Promise.reject(new BadRequestError("El medico no tiene disponibilidad el dia " + diaSemana + " a las " + horaNum + ":00"));
        }
        return this.turnoRepository.buscarPorMedicoFechaYHora(datos.medicoId, datos.fecha, datos.hora);
      })
      .then((turnoExistente) => {
        if (turnoExistente) return Promise.reject(new ConflictError("Ya existe un turno para ese medico en ese horario"));
        return this.turnoRepository.crear(datos.medicoId, datos.fecha, datos.hora);
      });
  }

  // Cancela un turno verificando que falte al menos 1 hora → Promise<boolean>
  // Viene de: TurnoController.cancelarTurno() con id validado
  // Paso 1: Verifica que el turno exista en TurnoRepository
  // Paso 2: Calcula la diferencia entre la fecha del turno y ahora
  // Paso 3: Si falta menos de 1 hora, rechaza con BadRequestError
  // Paso 4: Elimina el turno del TurnoRepository
  cancelarTurno(turnoId) {
    return this.turnoRepository.obtenerPorId(turnoId).then((turno) => {
      if (!turno) {
        return Promise.reject(new NotFoundError("Turno no encontrado"));
      }
      if (!turno.puedeCancelarse()) {
        return Promise.reject(
          new BadRequestError(
            "No se puede cancelar el turno con menos de una hora de antelacion",
          ),
        );
      }
      return this.turnoRepository.eliminar(turnoId);
    });
  }

  buscarPorMedico(medicoId) {
    return this.turnoRepository.buscarPorMedico(medicoId);
  }
}
