import { z } from "zod";
import { TIPOS_PERSONAL } from "../domain/Personal.js";

const nombreCampo = z.string().trim().min(1).max(80);

export const crearPersonalSchema = z.object({
    nombre:        nombreCampo,
    apellido:      nombreCampo,
    documento:     z.string().trim().min(6, "El documento debe tener al menos 6 caracteres").max(20),
    telefono:      z.string().trim().min(6).max(30).nullish(),
    email:         z.string().trim().email("email inválido").max(120).nullish(),
    tipo:          z.enum(Object.values(TIPOS_PERSONAL), {
        message: `tipo debe ser uno de: ${Object.values(TIPOS_PERSONAL).join(", ")}`,
    }),
    sede:          z.string().trim().min(1).max(100).nullish(),
    observaciones: z.string().trim().max(500).nullish(),
    activo:        z.boolean().default(true),
});

// Edición parcial: todos los campos son opcionales, pero hay que mandar alguno.
export const modificarPersonalSchema = crearPersonalSchema
    .partial()
    .refine((datos) => Object.keys(datos).length > 0, {
        message: "Hay que enviar al menos un campo para modificar",
    });

export const cambiarEstadoPersonalSchema = z.object({
    activo: z.boolean({ message: "activo debe ser true o false" }),
});
