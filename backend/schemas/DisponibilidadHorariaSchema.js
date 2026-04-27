import { z } from "zod";

export const DisponibilidadHorariaSchema = z.object({
  diaSemana: z.literal([
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
    "domingo",
  ]),
  horaDesde: z.int().gt(-1).lt(24),
  horaHasta: z.int().gt(-1).lt(24),
});
