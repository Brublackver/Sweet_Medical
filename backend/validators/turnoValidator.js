import { z } from "zod";
import { crearTurnoSchema } from "../schemas/crearTurnoSchema.js";
import { BadRequestError } from "../errors/AppError.js";

export function validarId(id) {
  return z.int().gt(0).parseAsync(Number(id))
    .catch(() => Promise.reject(new BadRequestError("El parametro id debe ser un entero positivo")));
}

export function validarCrearTurno(data) {
  return crearTurnoSchema.parseAsync(data)
    .catch(error => Promise.reject(new BadRequestError(formatearErrores(error))));
}

function formatearErrores(error) {
  return error.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join(", ");
}
