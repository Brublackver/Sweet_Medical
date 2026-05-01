import { z } from "zod";

export const DisponibilidadHorariaSchema = z.object({
  fecha: z.string().date("Formato de fecha invalido. Usar YYYY-MM-DD"),
  horaDesde: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora invalida. Usar HH:MM entre 00:00 y 23:59"),
  horaHasta: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora invalida. Usar HH:MM entre 00:00 y 23:59"),
});
