import {
    crearObraSocialSchema, suscripcionSchema, cambiarEstadoSchema,
} from "../schemas/obraSocialSchema.js";
import { BadRequestError }   from "../errors/AppError.js";
import { formatearErrores }  from "../validators/sharedValidator.js";
import { validarIdNumerico } from "../validators/pacienteValidator.js";

// Convierte "true"/"false" del query string a booleano. undefined si no vino.
const parseBooleano = (valor) => {
    if (valor === undefined) return undefined;
    return valor === "true";
};

export class ObraSocialController {
    constructor({ obraSocialService } = {}) {
        this.obraSocialService = obraSocialService;
    }

    // GET /obra-social — catálogo completo con planes, estado y suscripción.
    // Filtros opcionales: ?activa=true|false y ?vigente=true|false
    obtenerTodas = (req, res, next) => {
        const filtros = {
            activa:  parseBooleano(req.query.activa),
            vigente: parseBooleano(req.query.vigente),
        };
        return this.obraSocialService.obtenerTodas(filtros)
            .then((obrasSociales) => res.status(200).json({ status: "success", data: obrasSociales }))
            .catch(next);
    };

    // GET /obra-social/:id
    obtenerPorId = (req, res, next) =>
        validarIdNumerico(req.params.id)
            .then((id) => this.obraSocialService.obtenerPorId(id))
            .then((obraSocial) => res.status(200).json({ status: "success", data: obraSocial }))
            .catch(next);

    // GET /obra-social/:id/suscripcion — estado consolidado del vínculo comercial.
    consultarEstado = (req, res, next) =>
        validarIdNumerico(req.params.id)
            .then((id) => this.obraSocialService.consultarEstado(id))
            .then((estado) => res.status(200).json({ status: "success", data: estado }))
            .catch(next);

    // POST /obra-social
    crear = (req, res, next) =>
        crearObraSocialSchema.parseAsync(req.body)
            .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))))
            .then((body) => this.obraSocialService.crear(body))
            .then((obraSocial) => res.status(201).json({ status: "success", data: obraSocial }))
            .catch(next);

    // PUT /obra-social/:id/suscripcion — alta o actualización de la suscripción.
    registrarSuscripcion = (req, res, next) =>
        Promise.all([
            validarIdNumerico(req.params.id),
            suscripcionSchema.parseAsync(req.body ?? {})
                .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error)))),
        ])
            .then(([id, datos]) => this.obraSocialService.registrarSuscripcion(id, datos))
            .then((obraSocial) => res.status(200).json({ status: "success", data: obraSocial }))
            .catch(next);

    // PATCH /obra-social/:id/suscripcion/estado — body: { activa: true|false }
    cambiarEstadoSuscripcion = (req, res, next) =>
        Promise.all([
            validarIdNumerico(req.params.id),
            cambiarEstadoSchema.parseAsync(req.body ?? {})
                .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error)))),
        ])
            .then(([id, { activa }]) => this.obraSocialService.cambiarEstadoSuscripcion(id, activa))
            .then((obraSocial) => res.status(200).json({ status: "success", data: obraSocial }))
            .catch(next);

    // PATCH /obra-social/:id/estado — alta/baja de la obra social del catálogo.
    cambiarEstado = (req, res, next) =>
        Promise.all([
            validarIdNumerico(req.params.id),
            cambiarEstadoSchema.parseAsync(req.body ?? {})
                .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error)))),
        ])
            .then(([id, { activa }]) => this.obraSocialService.cambiarEstado(id, activa))
            .then((obraSocial) => res.status(200).json({ status: "success", data: obraSocial }))
            .catch(next);
}
