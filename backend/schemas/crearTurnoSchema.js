import { z } from "zod";

export const crearTurnoSchema = z.object({
  medicoId: z
    .number()
    .int()
    .positive("El medicoId debe ser un entero positivo"),
  fecha: z.string().date("El formato de fecha es invalido. Usar YYYY-MM-DD"),
  hora: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "El formato de hora es invalido. Usar HH:MM"),
});
