/*
    CONTROLLER — Capa de entrada HTTP para Médicos

    Responsabilidad única: traducir HTTP → Service → HTTP.
    No contiene lógica de negocio ni accede a datos directamente.
*/

import {
    validarId,
    validarCrearMedico,
    validarDisponibilidad,
    validarCancelarTurno,
    validarCambioFecha,
    validarCrearServicio,
    validarModificarServicio,
} from "../validators/medicoValidator.js";
import { BadRequestError } from "../errors/AppError.js";

export class MedicoController {
    constructor({ medicoService } = {}) {
        this.medicoService = medicoService;
    }

    // --- CRUD médico y disponibilidad (existentes) --------------------------

    obtenerMedico = (req, res, next) =>
        validarId(req.params.id)
            .then((id) => this.medicoService.obtenerPorId(id))
            .then((medico) => res.status(200).json({ status: "success", data: medico }))
            .catch(next);

    obtenerTodos = (req, res, next) =>
        this.medicoService.obtenerTodos()
            .then((medicos) => res.status(200).json({ status: "success", data: medicos }))
            .catch(next);

    crearMedico = (req, res, next) =>
        validarCrearMedico(req.body)
            .then((body) => this.medicoService.crear(body))
            .then((medico) => res.status(201).json({ status: "success", data: medico }))
            .catch(next);

    obtenerDisponibilidad = (req, res, next) => {
        const { fecha } = req.query;
        return validarId(req.params.id)
            .then((id) => fecha
                ? this.medicoService.obtenerDisponibilidadPorFecha(id, fecha)
                : this.medicoService.obtenerDisponibilidad(id)
            )
            .then((disponibilidad) => res.status(200).json({ status: "success", data: disponibilidad }))
            .catch(next);
    };

    // Consulta slots libres para una fecha y duración dada.
    // Acepta query params opcionales: ?fecha=&duracion=&especialidad=&practica=
    consultarSlotsDisponibles = (req, res, next) => {
        const { fecha, duracion, especialidad, practica } = req.query;

        if (!fecha || !duracion)
            return next(new BadRequestError("Los parámetros fecha y duracion son requeridos"));

        return validarId(req.params.id)
            .then((medicoId) =>
                this.medicoService.consultarSlotsDisponibles(
                    medicoId, fecha, Number(duracion), { especialidad, practica }
                )
            )
            .then((slots) => res.status(200).json({ status: "success", data: slots }))
            .catch(next);
    };

    definirDisponibilidad = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarDisponibilidad(req.body)])
            .then(([id, body]) => this.medicoService.definirDisponibilidad(id, body))
            .then(() => res.status(201).json({ status: "success" }))
            .catch(next);

    cambiarDisponibilidad = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarDisponibilidad(req.body)])
            .then(([id, body]) => this.medicoService.cambiarDisponibilidad(id, body))
            .then(() => res.status(204).send())
            .catch(next);

    obtenerDisponibilidadPorId = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.disponibilidadId)])
            .then(([medicoId, disponibilidadId]) =>
                this.medicoService.obtenerDisponibilidadPorId(medicoId, disponibilidadId)
            )
            .then((disp) => res.status(200).json({ status: "success", data: disp }))
            .catch(next);

    eliminarDisponibilidadPorId = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.disponibilidadId)])
            .then(([medicoId, disponibilidadId]) =>
                this.medicoService.eliminarDisponibilidadPorId(medicoId, disponibilidadId)
            )
            .then(() => res.status(204).send())
            .catch(next);

    // --- Operaciones sobre turnos -------------------------------------------

    cancelarTurno = (req, res, next) =>
        Promise.all([
            validarId(req.params.id),
            validarId(req.params.turnoId),
            validarCancelarTurno(req.body),
        ])
            .then(([medicoId, turnoId, body]) =>
                this.medicoService.cancelarTurno(medicoId, turnoId, body.motivo)
            )
            .then((turno) => res.status(200).json({ status: "success", data: turno }))
            .catch(next);

    historialTurnosDePaciente = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.pacienteId)])
            .then(([medicoId, pacienteId]) =>
                this.medicoService.historialTurnosDePaciente(medicoId, pacienteId)
            )
            .then((turnos) => res.status(200).json({ status: "success", data: turnos }))
            .catch(next);

    proponerCambioFecha = (req, res, next) =>
        Promise.all([
            validarId(req.params.id),
            validarId(req.params.turnoId),
            validarCambioFecha(req.body),
        ])
            .then(([medicoId, turnoId, body]) =>
                this.medicoService.proponerCambioFecha(medicoId, turnoId, body.nuevaFecha, body.nuevaHora)
            )
            .then((turno) => res.status(200).json({ status: "success", data: turno }))
            .catch(next);

    confirmarCambioPaciente = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.turnoId)])
            .then(([medicoId, turnoId]) =>
                this.medicoService.confirmarCambioPaciente(medicoId, turnoId)
            )
            .then((turno) => res.status(200).json({ status: "success", data: turno }))
            .catch(next);

    rechazarCambioPaciente = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.turnoId)])
            .then(([medicoId, turnoId]) =>
                this.medicoService.rechazarCambioPaciente(medicoId, turnoId)
            )
            .then((turno) => res.status(200).json({ status: "success", data: turno }))
            .catch(next);

    marcarTurnoRealizado = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.turnoId)])
            .then(([medicoId, turnoId]) =>
                this.medicoService.marcarTurnoRealizado(medicoId, turnoId)
            )
            .then((turno) => res.status(200).json({ status: "success", data: turno }))
            .catch(next);

    // --- Gestión de sedes ------------------------------------------------------

    asignarSede = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.sedeId)])
            .then(([medicoId, sedeId]) => this.medicoService.asignarSede(medicoId, sedeId))
            .then((sede) => res.status(200).json({ status: "success", data: sede }))
            .catch(next);

    quitarSede = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.sedeId)])
            .then(([medicoId, sedeId]) => this.medicoService.quitarSede(medicoId, sedeId))
            .then(() => res.status(204).send())
            .catch(next);

    // --- Gestión de servicios: Especialidades ----------------------------------

    agregarEspecialidad = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarCrearServicio(req.body)])
            .then(([medicoId, body]) => this.medicoService.agregarEspecialidad(medicoId, body))
            .then((esp) => res.status(201).json({ status: "success", data: esp }))
            .catch(next);

    modificarEspecialidad = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.espId), validarModificarServicio(req.body)])
            .then(([medicoId, espId, body]) => this.medicoService.modificarEspecialidad(medicoId, espId, body))
            .then((esp) => res.status(200).json({ status: "success", data: esp }))
            .catch(next);

    eliminarEspecialidad = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.espId)])
            .then(([medicoId, espId]) => this.medicoService.eliminarEspecialidad(medicoId, espId))
            .then(() => res.status(204).send())
            .catch(next);

    // --- Gestión de servicios: Prácticas ---------------------------------------

    agregarPractica = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarCrearServicio(req.body)])
            .then(([medicoId, body]) => this.medicoService.agregarPractica(medicoId, body))
            .then((prac) => res.status(201).json({ status: "success", data: prac }))
            .catch(next);

    modificarPractica = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.practicaId), validarModificarServicio(req.body)])
            .then(([medicoId, practicaId, body]) => this.medicoService.modificarPractica(medicoId, practicaId, body))
            .then((prac) => res.status(200).json({ status: "success", data: prac }))
            .catch(next);

    eliminarPractica = (req, res, next) =>
        Promise.all([validarId(req.params.id), validarId(req.params.practicaId)])
            .then(([medicoId, practicaId]) => this.medicoService.eliminarPractica(medicoId, practicaId))
            .then(() => res.status(204).send())
            .catch(next);
}
