import { crearPacienteSchema }       from "../schemas/crearPacienteSchema.js";
import { cancelarTurnoSchema }        from "../schemas/cancelarTurnoSchema.js";
import { solicitarCambioFechaSchema } from "../schemas/solicitarCambioFechaSchema.js";
import { reservarTurnoSchema }        from "../schemas/crearTurnoSchema.js";
import { coberturaSchema }            from "../schemas/coberturaSchema.js";
import { BadRequestError }            from "../errors/AppError.js";
import { validarId, validarIdNumerico, formatearErrores } from "./sharedValidator.js";

export { validarId, validarIdNumerico };

export const validarCrearPaciente = (data) =>
    crearPacienteSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarCancelarTurno = (data) =>
    cancelarTurnoSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarSolicitarCambioFecha = (data) =>
    solicitarCambioFechaSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarReservarTurno = (data) =>
    reservarTurnoSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarCobertura = (data) =>
    coberturaSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));
