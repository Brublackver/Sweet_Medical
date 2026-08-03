import { crearAvisoSchema }     from "../schemas/crearAvisoSchema.js";
import { BadRequestError }      from "../errors/AppError.js";
import { formatearErrores }     from "../validators/sharedValidator.js";
import { validarIdNumerico }    from "../validators/pacienteValidator.js";
import { ESTADOS_AVISO }        from "../domain/AvisoDisponibilidad.js";

/*
    CONTROLLER — Avisos de disponibilidad (fila de espera)

    Recurso anidado bajo el paciente, igual que las notificaciones:
      POST   /paciente/:id/avisos            → suscribirse a estos filtros
      GET    /paciente/:id/avisos            → ver mis avisos (?estado=ACTIVO)
      DELETE /paciente/:id/avisos/:avisoId   → dar de baja el aviso
*/
export class AvisoDisponibilidadController {
    constructor({ avisoDisponibilidadService } = {}) {
        this.avisoDisponibilidadService = avisoDisponibilidadService;
    }

    crear = (req, res, next) =>
        Promise.all([
            validarIdNumerico(req.params.id),
            crearAvisoSchema.parseAsync(req.body ?? {})
                .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error)))),
        ])
            .then(([pacienteId, filtros]) => this.avisoDisponibilidadService.crear(pacienteId, filtros))
            .then((aviso) => res.status(201).json({ status: "success", data: aviso }))
            .catch(next);

    obtenerTodos = (req, res, next) => {
        const { estado } = req.query;
        if (estado !== undefined && !Object.values(ESTADOS_AVISO).includes(estado))
            return next(new BadRequestError(
                `estado debe ser uno de: ${Object.values(ESTADOS_AVISO).join(", ")}`
            ));

        return validarIdNumerico(req.params.id)
            .then((pacienteId) => this.avisoDisponibilidadService.obtenerPorPaciente(pacienteId, estado))
            .then((avisos) => res.status(200).json({ status: "success", data: avisos }))
            .catch(next);
    };

    cancelar = (req, res, next) =>
        Promise.all([
            validarIdNumerico(req.params.id),
            validarIdNumerico(req.params.avisoId),
        ])
            .then(([pacienteId, avisoId]) => this.avisoDisponibilidadService.cancelar(pacienteId, avisoId))
            .then((aviso) => res.status(200).json({ status: "success", data: aviso }))
            .catch(next);
}
