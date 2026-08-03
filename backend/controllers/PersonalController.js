import {
    crearPersonalSchema, modificarPersonalSchema, cambiarEstadoPersonalSchema,
} from "../schemas/personalSchema.js";
import { TIPOS_PERSONAL }    from "../domain/Personal.js";
import { BadRequestError }   from "../errors/AppError.js";
import { formatearErrores }  from "../validators/sharedValidator.js";
import { validarIdNumerico } from "../validators/pacienteValidator.js";

export class PersonalController {
    constructor({ personalService } = {}) {
        this.personalService = personalService;
    }

    // GET /personal — listado con filtros opcionales ?tipo= y ?activo=true|false
    obtenerTodos = (req, res, next) => {
        const { tipo, activo } = req.query;

        if (tipo !== undefined && !Object.values(TIPOS_PERSONAL).includes(tipo))
            return next(new BadRequestError(
                `tipo debe ser uno de: ${Object.values(TIPOS_PERSONAL).join(", ")}`
            ));

        const filtros = {
            tipo,
            activo: activo === undefined ? undefined : activo === "true",
        };

        return this.personalService.obtenerTodos(filtros)
            .then((personal) => res.status(200).json({ status: "success", data: personal }))
            .catch(next);
    };

    // GET /personal/tipos — catálogo de tipos disponibles, para poblar la UI sin
    // que el front tenga que hardcodear la lista.
    obtenerTipos = (req, res) =>
        res.status(200).json({ status: "success", data: Object.values(TIPOS_PERSONAL) });

    obtenerPorId = (req, res, next) =>
        validarIdNumerico(req.params.id)
            .then((id) => this.personalService.obtenerPorId(id))
            .then((personal) => res.status(200).json({ status: "success", data: personal }))
            .catch(next);

    crear = (req, res, next) =>
        crearPersonalSchema.parseAsync(req.body)
            .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))))
            .then((body) => this.personalService.crear(body))
            .then((personal) => res.status(201).json({ status: "success", data: personal }))
            .catch(next);

    actualizar = (req, res, next) =>
        Promise.all([
            validarIdNumerico(req.params.id),
            modificarPersonalSchema.parseAsync(req.body ?? {})
                .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error)))),
        ])
            .then(([id, datos]) => this.personalService.actualizar(id, datos))
            .then((personal) => res.status(200).json({ status: "success", data: personal }))
            .catch(next);

    // PATCH /personal/:id/estado — body: { activo: true|false } (baja lógica)
    cambiarEstado = (req, res, next) =>
        Promise.all([
            validarIdNumerico(req.params.id),
            cambiarEstadoPersonalSchema.parseAsync(req.body ?? {})
                .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error)))),
        ])
            .then(([id, { activo }]) => this.personalService.cambiarEstado(id, activo))
            .then((personal) => res.status(200).json({ status: "success", data: personal }))
            .catch(next);

    // DELETE /personal/:id — borrado físico (corrección de cargas erróneas).
    eliminar = (req, res, next) =>
        validarIdNumerico(req.params.id)
            .then((id) => this.personalService.eliminar(id))
            .then(() => res.status(200).json({ status: "success", data: null }))
            .catch(next);
}
