import { z } from "zod";

// DECLARATIVIDAD: el schema describe la forma del dato esperado.
// La validación está separada de la lógica de negocio (unicidad de DNI)
// que vive en PacienteService — cada capa tiene una sola responsabilidad.
export const crearPacienteSchema = z.object({
    usuario:    z.string().min(3, "El usuario debe tener al menos 3 caracteres").trim(),
    dni:        z.string().regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 dígitos"),
    nombre:     z.string().min(2, "El nombre debe tener al menos 2 caracteres").trim(),
    obraSocial: z.string().min(2, "La obra social es requerida").trim(),
    plan:       z.string().min(1, "El plan es requerido").trim(),
});
