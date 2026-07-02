import { z } from "zod";

export const coberturaSchema = z.object({
    codigo: z.string().min(1, "El código es requerido").transform((s) => s.trim().toUpperCase()),
    nivel:  z.number({ invalid_type_error: "El nivel debe ser un número" }).int().min(0).max(100),
});
