import { z } from "zod";

export const MedicoSchema = z.object({
  id: z.int().gt(0),
  usuario: z.string().max(30),
  nombre: z.string().max(30),
  matricula: z.number().max(10),
});
