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
    return validarId(req.params.id)
      .then(id => this.medicoService.obtenerPorId(id))
      .then(medico => res.status(200).json({ status: "success", data: medico }))
      .catch(next);
  };

  obtenerTodos = (req, res, next) => {
    return this.medicoService
      .obtenerTodos()
      .then(medicos => res.status(200).json({ status: "success", data: medicos }))
      .catch(next);
  };

  crearMedico = (req, res, next) => {
    return validarCrearMedico(req.body)
      .then(body => this.medicoService.crear(body))
      .then(medico => res.status(201).json({ status: "success", message: "Medico creado exitosamente", data: medico }))
      .catch(next);
  };

  obtenerDisponibilidad = (req, res, next) => {
    const { fecha } = req.query;
    return validarId(req.params.id)
      .then(id => fecha
        ? this.medicoService.obtenerDisponibilidadPorFecha(id, fecha)
        : this.medicoService.obtenerDisponibilidad(id))
      .then(disponibilidad => res.status(200).json({ status: "success", data: disponibilidad }))
      .catch(next);
  };

  definirDisponibilidad = (req, res, next) => {
    return Promise.all([validarId(req.params.id), validarDisponibilidad(req.body)])
      .then(([id, body]) => this.medicoService.definirDisponibilidad(id, body))
      .then(() => res.status(201).json({ status: "success" }))
      .catch(next);
  };

  cambiarDisponibilidad = (req, res, next) => {
    return Promise.all([validarId(req.params.id), validarDisponibilidad(req.body)])
      .then(([id, body]) => this.medicoService.cambiarDisponibilidad(id, body))
      .then(() => res.status(204).send())
      .catch(next);
  };

  obtenerDisponibilidadPorId = (req, res, next) => {
    return Promise.all([
      validarId(req.params.id),
      validarId(req.params.disponibilidadId),
    ])
      .then(([medicoId, disponibilidadId]) => this.medicoService.obtenerDisponibilidadPorId(medicoId, disponibilidadId))
      .then(disp => res.status(200).json({ status: "success", data: disp }))
      .catch(next);
  };

  eliminarDisponibilidadPorId = (req, res, next) => {
    return Promise.all([
      validarId(req.params.id),
      validarId(req.params.disponibilidadId),
    ])
      .then(([medicoId, disponibilidadId]) => this.medicoService.eliminarDisponibilidadPorId(medicoId, disponibilidadId))
      .then(() => res.status(204).send())
      .catch(next);
  };
}
