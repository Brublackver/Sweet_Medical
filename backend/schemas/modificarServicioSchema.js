import { z } from "zod";

export const modificarServicioSchema = z.object({
    nombre:             z.string().min(1, "El nombre es obligatorio").max(100),
    duracionTurnoEnMins: z.number().int().positive("La duración debe ser un entero positivo"),
    costo:              z.number().nonnegative("El costo no puede ser negativo"),
});
