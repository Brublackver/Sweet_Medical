import { z } from "zod";
import { crearPacienteSchema }        from "../schemas/crearPacienteSchema.js";
import { cancelarTurnoSchema }         from "../schemas/cancelarTurnoSchema.js";
import { solicitarCambioFechaSchema }  from "../schemas/solicitarCambioFechaSchema.js";
import { BadRequestError }             from "../errors/AppError.js";

const formatearErrores = (error) =>
    error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");

export const validarId = (id) =>
    z.int().gt(0).parseAsync(Number(id))
        .catch(() => Promise.reject(new BadRequestError("El parámetro id debe ser un entero positivo")));

export const validarCrearPaciente = (data) =>
    crearPacienteSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarCancelarTurno = (data) =>
    cancelarTurnoSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarSolicitarCambioFecha = (data) =>
    solicitarCambioFechaSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));
