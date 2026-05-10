import mongoose             from "mongoose";
import { BadRequestError } from "../errors/AppError.js";

// Valida que un parámetro de ruta sea un ObjectId válido de MongoDB.
// Compartido entre todos los validators para evitar duplicación.
export const validarId = (id) => {
    if (!mongoose.isValidObjectId(id))
        return Promise.reject(new BadRequestError("El parámetro id debe ser un ObjectId válido"));
    return Promise.resolve(id);
};

// Convierte los errores de Zod a un string legible.
// Formato: "campo: mensaje, campo2: mensaje2"
export const formatearErrores = (error) =>
    error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
