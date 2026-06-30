import { z } from "zod";

// El plan trae un porcentaje de cobertura general (0–100) que sale del catálogo
// de obras sociales. El paciente elige obra social + plan; no lo arma a mano.
const planSchema = z.object({
    nombre:           z.string().min(1, "El nombre del plan es requerido"),
    coberturaGeneral: z.number().min(0).max(100),
});

export const crearPacienteSchema = z.object({
    usuario:    z.string().min(3, "El usuario debe tener al menos 3 caracteres").trim(),
    // Opcional: si no se envía, el service usa el usuario como contraseña inicial.
    password:   z.string().min(4, "La contraseña debe tener al menos 4 caracteres").optional(),
    dni:        z.string().regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 dígitos"),
    nombre:     z.string().min(2, "El nombre debe tener al menos 2 caracteres").trim(),
    obraSocial: z.string().min(2, "La obra social es requerida").trim(),
    plan:       planSchema,
});
