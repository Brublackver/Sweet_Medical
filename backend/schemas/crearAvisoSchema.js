import { z } from "zod";

// Los mismos filtros que acepta GET /turno/buscar. Todos opcionales: un aviso
// sin filtros es válido ("avisame de cualquier turno"). pacienteId NO viaja en
// el body — sale del token / de la ruta, igual que en el resto del sistema.
const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "debe tener formato YYYY-MM-DD");

export const crearAvisoSchema = z.object({
    medicoId:     z.coerce.number().int().positive().nullish(),
    especialidad: z.string().trim().min(1).max(100).nullish(),
    practica:     z.string().trim().min(1).max(100).nullish(),
    sede:         z.string().trim().min(1).max(100).nullish(),
    obraSocial:   z.string().trim().min(1).max(100).nullish(),
    fechaDesde:   fechaISO.nullish(),
    fechaHasta:   fechaISO.nullish(),
}).refine(
    (datos) => !datos.fechaDesde || !datos.fechaHasta || datos.fechaDesde <= datos.fechaHasta,
    { message: "fechaDesde no puede ser posterior a fechaHasta", path: ["fechaDesde"] }
);
