import { validarCrearTurno } from "../validators/turnoValidator.js";

export class TurnoController {
    constructor({ turnoService } = {}) {
        this.turnoService = turnoService;
    }

    obtenerTodos = (req, res, next) =>
        this.turnoService.obtenerTodos()
            .then((turnos) => res.status(200).json({ status: "success", data: turnos }))
            .catch(next);

    crearTurno = (req, res, next) =>
        validarCrearTurno(req.body)
            .then((body) => this.turnoService.crearTurno(body))
            .then((turno) => res.status(201).json({ status: "success", data: turno }))
            .catch(next);
}
