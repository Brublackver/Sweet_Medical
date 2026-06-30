import mongoose             from "mongoose";
import { BadRequestError } from "../errors/AppError.js";
import { resetPasswordSchema } from "../schemas/resetPasswordSchema.js";

// Valida que un parámetro de ruta sea un ObjectId válido de MongoDB.
export const validarId = (id) => {
    if (!mongoose.isValidObjectId(id))
        return Promise.reject(new BadRequestError("El parámetro id debe ser un ObjectId válido"));
    return Promise.resolve(id);
};

// Valida que un parámetro de ruta sea un entero positivo (IDs de dominio).
export const validarIdNumerico = (id) => {
    const num = Number(id);
    if (!Number.isInteger(num) || num <= 0)
        return Promise.reject(new BadRequestError("El parámetro id debe ser un entero positivo"));
    return Promise.resolve(num);
};

// Convierte los errores de Zod a un string legible.
// Formato: "campo: mensaje, campo2: mensaje2"
// Zod v4 expone los problemas en `.issues` (`.errors` quedó deprecado/removido).
// Mantenemos el fallback a `.errors` por compatibilidad con v3.
export const formatearErrores = (error) =>
    (error.issues ?? error.errors ?? []).map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");

// Valida el body de un reset de contraseña ({ password }). Compartido por
// pacientes y médicos: la regla es la misma para ambos.
export const validarResetPassword = (data) =>
    resetPasswordSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));
