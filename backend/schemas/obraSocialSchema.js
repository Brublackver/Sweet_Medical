import { z } from "zod";
import { ESTADOS_SUSCRIPCION } from "../domain/ObraSocial.js";

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "debe tener formato YYYY-MM-DD");

const planSchema = z.object({
    nombre:           z.string().trim().min(1).max(50),
    coberturaGeneral: z.coerce.number().int().min(0).max(100),
});

// Par clave/valor libre. Es el punto de extensión de la suscripción: topes,
// copagos, condiciones especiales... todo entra acá sin tocar el schema.
const caracteristicaSchema = z.object({
    clave: z.string().trim().min(1).max(50),
    valor: z.string().trim().min(1).max(200),
});

export const crearObraSocialSchema = z.object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
    planes: z.array(planSchema).default([]),
    activa: z.boolean().default(true),
});

export const suscripcionSchema = z.object({
    modalidad:        z.string().trim().min(1).max(50).default("ESTANDAR"),
    estado:           z.enum(Object.values(ESTADOS_SUSCRIPCION)).default(ESTADOS_SUSCRIPCION.ACTIVA),
    fechaInicio:      fechaISO.nullish(),
    fechaVencimiento: fechaISO.nullish(),
    contacto:         z.string().trim().max(150).nullish(),
    observaciones:    z.string().trim().max(500).nullish(),
    caracteristicas:  z.array(caracteristicaSchema).default([]),
}).refine(
    (datos) => !datos.fechaInicio || !datos.fechaVencimiento || datos.fechaInicio <= datos.fechaVencimiento,
    { message: "fechaInicio no puede ser posterior a fechaVencimiento", path: ["fechaInicio"] }
);

// Activar/desactivar: tanto la obra social como su suscripción.
export const cambiarEstadoSchema = z.object({
    activa: z.boolean({ message: "activa debe ser true o false" }),
});
