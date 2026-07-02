import { z } from "zod";

export const crearMedicoSchema = z.object({
  usuario: z.string().min(1, "El usuario es obligatorio").max(30),
  // Opcional: si no se envía, el service usa el usuario como contraseña inicial.
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres").optional(),
  nombre: z.string().min(1, "El nombre es obligatorio").max(30),
  matricula: z.string().min(1, "La matricula es obligatoria").max(10),
});
