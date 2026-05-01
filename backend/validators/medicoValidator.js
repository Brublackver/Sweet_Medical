import { z } from "zod";
import { crearMedicoSchema } from "../schemas/CrearMedicoSchema.js";
import { DisponibilidadHorariaSchema } from "../schemas/DisponibilidadHorariaSchema.js";
import { BadRequestError } from "../errors/AppError.js";

export function validarId(id) {
  return z.int().gt(0).parseAsync(Number(id))
    .catch(() => Promise.reject(new BadRequestError("El parametro id debe ser un entero positivo")));
}

export function validarCrearMedico(data) {
  return crearMedicoSchema.parseAsync(data)
    .catch(error => Promise.reject(new BadRequestError(formatearErrores(error))));
}

export function validarDisponibilidad(data) {
  return DisponibilidadHorariaSchema.parseAsync(data)
    .catch(error => Promise.reject(new BadRequestError(formatearErrores(error))));
}

function formatearErrores(error) {
  return error.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join(", ");
}
