import { z } from "zod";
import { crearPacienteSchema } from "./crearPacienteSchema.js";

/*
    REGISTRO PÚBLICO — Igual que crear paciente, pero la contraseña es
    OBLIGATORIA: en el auto-registro el paciente DEBE elegir su clave
    (no puede quedar el usuario como contraseña por defecto).
*/
export const registroPacienteSchema = crearPacienteSchema.extend({
    password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
});
