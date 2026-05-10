import { crearMedicoSchema }           from "../schemas/CrearMedicoSchema.js";
import { DisponibilidadHorariaSchema } from "../schemas/DisponibilidadHorariaSchema.js";
import { cancelarTurnoSchema }         from "../schemas/cancelarTurnoSchema.js";
import { solicitarCambioFechaSchema }  from "../schemas/solicitarCambioFechaSchema.js";
import { crearServicioSchema }         from "../schemas/crearServicioSchema.js";
import { modificarServicioSchema }     from "../schemas/modificarServicioSchema.js";
import { BadRequestError }             from "../errors/AppError.js";
import { validarId, formatearErrores } from "./sharedValidator.js";

export { validarId };

export const validarCrearMedico = (data) =>
    crearMedicoSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarDisponibilidad = (data) =>
    DisponibilidadHorariaSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarCancelarTurno = (data) =>
    cancelarTurnoSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarCambioFecha = (data) =>
    solicitarCambioFechaSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarCrearServicio = (data) =>
    crearServicioSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarModificarServicio = (data) =>
    modificarServicioSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));
