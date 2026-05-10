/*
    CONTROLLER — Capa de entrada HTTP para Turnos
    Recibe el request del cliente (Postman, frontend, etc).
    Delega la validacion al turnoValidator.
    Delega la logica de negocio al TurnoService.
    Los errores se propagan via next() al errorHandler centralizado.

        CONTROLLER
             |
    SERVICE --- DOMAIN
*/

import { validarCrearTurno } from "../validators/turnoValidator.js";

export class TurnoController {
  constructor({ turnoService } = {}) {
    this.turnoService = turnoService;
  }

  obtenerTodos = (req, res, next) => {
    return this.turnoService
      .obtenerTodos()
      .then(turnos => res.status(200).json({ status: "success", message: "Lista de todos los turnos", data: turnos }))
      .catch(next);
  };

  crearTurno = (req, res, next) => {
    return validarCrearTurno(req.body)
      .then(body => this.turnoService.crearTurno(body))
      .then(turno => res.status(201).json({ status: "success", message: "Turno creado exitosamente", data: turno }))
      .catch(next);
  };

}
