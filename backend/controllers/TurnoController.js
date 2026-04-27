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

import { TurnoService } from "../services/TurnoService.js";
import { validarId, validarCrearTurno } from "../validators/turnoValidator.js";

export class TurnoController {
  constructor({ turnoService = new TurnoService() } = {}) {
    this.turnoService = turnoService;
  }

  obtenerTodos = (req, res, next) => {
    return this.turnoService
      .obtenerTodos()
      .then((turnos) => {
        res
          .status(200)
          .json({
            status: "success",
            message: "Lista de todos los turnos",
            data: turnos,
          });
      })
      .catch(next);
  };

  crearTurno = (req, res, next) => {
    try {
      const body = validarCrearTurno(req.body);
      return this.turnoService
        .crearTurno(body)
        .then((turno) => {
          res
            .status(201)
            .json({
              status: "success",
              message: "Turno creado exitosamente",
              data: turno,
            });
        })
        .catch(next);
    } catch (error) {
      next(error);
    }
  };

  cancelarTurno = (req, res, next) => {
    try {const id = validarId(req.params.id);
      return this.turnoService.cancelarTurno(id)
      .then(() => {
          res.status(204).send();
        })
        .catch(next);
    } catch (error) {
      next(error);
    }
  };
}
