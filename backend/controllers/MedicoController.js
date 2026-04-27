/*
    CONTROLLER — Capa de entrada HTTP
    Recibe el request del cliente (Postman, frontend, etc).
    Delega la validacion al medicoValidator.
    Delega la logica de negocio al Service.
    Los errores se propagan via next() al errorHandler centralizado.

        CONTROLLER
             |
    SERVICE --- DOMAIN
*/

import { MedicoService } from "../services/MedicoService.js";
import {
  validarId,
  validarCrearMedico,
  validarDisponibilidad,
} from "../validators/medicoValidator.js";

export class MedicoController {
  constructor({ medicoService = new MedicoService() } = {}) {
    this.medicoService = medicoService;
  }

  obtenerMedico = (req, res, next) => {
    return this.medicoService
      .obtenerPorId(Number(req.params.id))
      .then((medico) => {
        res.status(200).json({ status: "success", data: medico });
      })
      .catch(next);
  };

  obtenerTodos = (req, res, next) => {
    return this.medicoService
      .obtenerTodos()
      .then((medicos) => {
        res.status(200).json({ status: "success", data: medicos });
      })
      .catch(next);
  };

  crearMedico = (req, res, next) => {
    try {
      const body = validarCrearMedico(req.body);
      return this.medicoService
        .crear(body)
        .then((medico) => {
          res
            .status(201)
            .json({
              status: "success",
              message: "Medico creado exitosamente",
              data: medico,
            });
        })
        .catch(next);
    } catch (error) {
      next(error);
    }
  };

  obtenerDisponibilidad = (req, res, next) => {
    try {
      const id = validarId(req.params.id);
      return this.medicoService
        .obtenerDisponibilidad(id)
        .then((disponibilidad) => {
          res.status(200).json({ status: "success", data: disponibilidad });
        })
        .catch(next);
    } catch (error) {
      next(error);
    }
  };

  definirDisponibilidad = (req, res, next) => {
    try {
      const id = validarId(req.params.id);
      const body = validarDisponibilidad(req.body);
      return this.medicoService
        .definirDisponibilidad(id, body)
        .then(() => {
          res.status(201).json({ status: "success" });
        })
        .catch(next);
    } catch (error) {
      next(error);
    }
  };

  cambiarDisponibilidad = (req, res, next) => {
    try {
      const id = validarId(req.params.id);
      const body = validarDisponibilidad(req.body);
      return this.medicoService
        .cambiarDisponibilidad(id, body)
        .then(() => {
          res.status(204).send();
        })
        .catch(next);
    } catch (error) {
      next(error);
    }
  };

  eliminarDisponibilidad = (req, res, next) => {
    try {
      const id = validarId(req.params.id);
      return this.medicoService
        .eliminarDisponibilidad(id)
        .then(() => {
          res.status(204).send();
        })
        .catch(next);
    } catch (error) {
      next(error);
    }
  };
}
