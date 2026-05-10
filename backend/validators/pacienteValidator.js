import { crearPacienteSchema }       from "../schemas/crearPacienteSchema.js";
import { cancelarTurnoSchema }        from "../schemas/cancelarTurnoSchema.js";
import { solicitarCambioFechaSchema } from "../schemas/solicitarCambioFechaSchema.js";
import { BadRequestError }            from "../errors/AppError.js";
import { validarId, formatearErrores } from "./sharedValidator.js";

export { validarId };

export const validarCrearPaciente = (data) =>
    crearPacienteSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarCancelarTurno = (data) =>
    cancelarTurnoSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarSolicitarCambioFecha = (data) =>
    solicitarCambioFechaSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));
