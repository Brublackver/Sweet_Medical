import { z } from "zod";

export const cancelarTurnoSchema = z.object({
    motivo: z.string().min(5, "El motivo debe tener al menos 5 caracteres").trim(),
});
