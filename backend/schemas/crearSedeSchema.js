import { z } from "zod";

export const crearSedeSchema = z.object({
    nombre:    z.string().min(1, "El nombre es obligatorio").max(100),
    direccion: z.string().min(1, "La dirección es obligatoria").max(200),
});
