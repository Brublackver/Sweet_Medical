import { z } from "zod";

export const crearMedicoSchema = z.object({
  usuario: z.string().min(1, "El usuario es obligatorio").max(30),
  nombre: z.string().min(1, "El nombre es obligatorio").max(30),
  matricula: z.string().min(1, "La matricula es obligatoria").max(10),
});
