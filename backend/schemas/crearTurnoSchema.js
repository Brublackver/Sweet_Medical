import { z } from "zod";

export const crearTurnoSchema = z.object({
    medicoId:   z.number().int().positive("El medicoId debe ser un entero positivo"),
    pacienteId: z.number().int().positive("El pacienteId debe ser un entero positivo"),
    fecha:      z.string().date("El formato de fecha es inválido. Usar YYYY-MM-DD"),
    hora:       z.string().regex(/^\d{2}:\d{2}$/, "El formato de hora es inválido. Usar HH:MM"),
    duracion:   z.number().int().positive("La duración debe ser un entero positivo en minutos"),
});

export const reservarTurnoSchema = crearTurnoSchema.omit({ pacienteId: true });
