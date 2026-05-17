import { crearTurnoSchema }            from "../schemas/crearTurnoSchema.js";
import { BadRequestError }             from "../errors/AppError.js";
import { validarId, formatearErrores } from "./sharedValidator.js";

export { validarId };

export const validarCrearTurno = (data) =>
    crearTurnoSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));
