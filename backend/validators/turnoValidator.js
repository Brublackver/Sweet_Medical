import { z } from "zod";
import { crearTurnoSchema } from "../schemas/crearTurnoSchema.js";
import { BadRequestError } from "../errors/AppError.js";

export function validarId(id) {
  const result = z.int().gt(0).safeParse(Number(id));
  if (!result.success)
    throw new BadRequestError("El parametro id debe ser un entero positivo");
  return result.data;
}

export function validarCrearTurno(data) {
  const result = crearTurnoSchema.safeParse(data);
  if (!result.success)
    throw new BadRequestError(formatearErrores(result.error));
  return result.data;
}

function formatearErrores(error) {
  return error.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join(", ");
}
