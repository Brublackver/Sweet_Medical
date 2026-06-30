import { loginSchema }             from "../schemas/loginSchema.js";
import { registroPacienteSchema }  from "../schemas/registroPacienteSchema.js";
import { BadRequestError }          from "../errors/AppError.js";
import { formatearErrores }         from "./sharedValidator.js";

export const validarLogin = (data) =>
    loginSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));

export const validarRegistroPaciente = (data) =>
    registroPacienteSchema.parseAsync(data)
        .catch((error) => Promise.reject(new BadRequestError(formatearErrores(error))));
