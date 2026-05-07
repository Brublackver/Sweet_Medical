import { crearSedeSchema }  from "../schemas/crearSedeSchema.js";
import { BadRequestError }  from "../errors/AppError.js";

const formatearErrores = (error) =>
    error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");

export class SedeController {
    constructor({ sedeService } = {}) {
        this.sedeService = sedeService;
    }

    obtenerTodas = (req, res, next) =>
        this.sedeService.obtenerTodas()
            .then((sedes) => res.status(200).json({ status: "success", data: sedes }))
            .catch(next);

    crearSede = (req, res, next) =>
        crearSedeSchema.parseAsync(req.body)
            .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))))
            .then((body) => this.sedeService.crear(body))
            .then((sede) => res.status(201).json({ status: "success", data: sede }))
            .catch(next);
}
