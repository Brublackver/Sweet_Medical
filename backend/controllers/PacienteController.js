/*
    CONTROLLER — Capa de entrada HTTP para Pacientes

    Responsabilidad única: traducir HTTP → Service → HTTP.
    No contiene lógica de negocio ni accede a datos directamente.
*/

import {
    validarId,
    validarIdNumerico,
    validarCrearPaciente,
    validarCancelarTurno,
    validarSolicitarCambioFecha,
} from "../validators/pacienteValidator.js";

export class PacienteController {
    constructor({ pacienteService } = {}) {
        this.pacienteService = pacienteService;
    }

    obtenerTodos = (req, res, next) =>
        this.pacienteService.obtenerTodos()
            .then((pacientes) => res.status(200).json({ status: "success", data: pacientes }))
            .catch(next);

    obtenerPaciente = (req, res, next) =>
        validarIdNumerico(req.params.id)
            .then((id) => this.pacienteService.obtenerPorId(id))
            .then((paciente) => res.status(200).json({ status: "success", data: paciente }))
            .catch(next);

    crearPaciente = (req, res, next) =>
        validarCrearPaciente(req.body)
            .then((body) => this.pacienteService.crear(body))
            .then((paciente) => res.status(201).json({ status: "success", data: paciente }))
            .catch(next);

    // El pacienteId viene del route param para garantizar que el paciente
    // solo pueda reservar turnos bajo su propio id.
    reservarTurno = (req, res, next) =>
        validarIdNumerico(req.params.id)
            .then((pacienteId) => this.pacienteService.reservarTurno(pacienteId, req.body))
            .then((turno) => res.status(201).json({ status: "success", data: turno }))
            .catch(next);

    obtenerHistorial = (req, res, next) =>
        validarIdNumerico(req.params.id)
            .then((pacienteId) => this.pacienteService.historialTurnos(pacienteId))
            .then((turnos) => res.status(200).json({ status: "success", data: turnos }))
            .catch(next);

    cancelarTurno = (req, res, next) =>
        Promise.all([
            validarIdNumerico(req.params.id),
            validarIdNumerico(req.params.turnoId),
            validarCancelarTurno(req.body),
        ])
            .then(([pacienteId, turnoId, body]) =>
                this.pacienteService.cancelarTurno(pacienteId, turnoId, body.motivo)
            )
            .then((turno) => res.status(200).json({ status: "success", data: turno }))
            .catch(next);

    solicitarCambioFecha = (req, res, next) =>
        Promise.all([
            validarIdNumerico(req.params.id),
            validarIdNumerico(req.params.turnoId),
            validarSolicitarCambioFecha(req.body),
        ])
            .then(([pacienteId, turnoId, body]) =>
                this.pacienteService.solicitarCambioFecha(pacienteId, turnoId, body.nuevaFecha, body.nuevaHora)
            )
            .then((turno) => res.status(200).json({ status: "success", data: turno }))
            .catch(next);

    confirmarPropuestaMedico = (req, res, next) =>
        Promise.all([validarIdNumerico(req.params.id), validarIdNumerico(req.params.turnoId)])
            .then(([pacienteId, turnoId]) =>
                this.pacienteService.confirmarPropuestaMedico(pacienteId, turnoId)
            )
            .then((turno) => res.status(200).json({ status: "success", data: turno }))
            .catch(next);

    rechazarPropuestaMedico = (req, res, next) =>
        Promise.all([validarIdNumerico(req.params.id), validarIdNumerico(req.params.turnoId)])
            .then(([pacienteId, turnoId]) =>
                this.pacienteService.rechazarPropuestaMedico(pacienteId, turnoId)
            )
            .then((turno) => res.status(200).json({ status: "success", data: turno }))
            .catch(next);
}
