import { z } from "zod";

export const crearPacienteSchema = z.object({
    usuario:    z.string().min(3, "El usuario debe tener al menos 3 caracteres").trim(),
    dni:        z.string().regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 dígitos"),
    nombre:     z.string().min(2, "El nombre debe tener al menos 2 caracteres").trim(),
    obraSocial: z.string().min(2, "La obra social es requerida").trim(),
    plan:       z.string().min(1, "El plan es requerido").trim(),
});
