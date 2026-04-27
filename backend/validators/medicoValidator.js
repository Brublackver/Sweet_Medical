import { z } from "zod";
import { crearMedicoSchema } from "../schemas/CrearMedicoSchema.js";
import { DisponibilidadHorariaSchema } from "../schemas/DisponibilidadHorariaSchema.js";
import { BadRequestError } from "../errors/AppError.js";

export function validarId(id) {
  const result = z.int().gt(0).safeParse(Number(id));
  if (!result.success)
    throw new BadRequestError("El parametro id debe ser un entero positivo");
  return result.data;
}

export function validarCrearMedico(data) {
  const result = crearMedicoSchema.safeParse(data);
  if (!result.success)
    throw new BadRequestError(formatearErrores(result.error));
  return result.data;
}

export function validarDisponibilidad(data) {
  const result = DisponibilidadHorariaSchema.safeParse(data);
  if (!result.success)
    throw new BadRequestError(formatearErrores(result.error));
  return result.data; // aca confirmamos q el body cumpla con el formato para definir dispo en 
}

function formatearErrores(error) {
  return error.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join(", ");
}
