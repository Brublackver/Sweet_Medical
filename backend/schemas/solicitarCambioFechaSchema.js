import { z } from "zod";

export const solicitarCambioFechaSchema = z.object({
    nuevaFecha: z.string().date("El formato de fecha es inválido. Usar YYYY-MM-DD"),
    nuevaHora:  z.string().regex(/^\d{2}:\d{2}$/, "El formato de hora es inválido. Usar HH:MM"),
});
