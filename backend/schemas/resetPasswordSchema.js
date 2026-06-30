import { z } from "zod";

/*
    RESET DE CONTRASEÑA — Solo el admin asigna una clave nueva (temporal).
    Las contraseñas no se pueden "ver" (están hasheadas con bcrypt, one-way):
    el admin RESETEA y comparte la temporal con el usuario.
*/
export const resetPasswordSchema = z.object({
    password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
});
