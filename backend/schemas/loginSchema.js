import { z } from "zod";

export const loginSchema = z.object({
    rol:      z.enum(["paciente", "medico", "admin"]),
    usuario:  z.string().trim().optional().default(""),
    password: z.string().min(1, "La contraseña es requerida"),
}).superRefine((data, ctx) => {
    // El usuario es obligatorio para paciente y médico (el admin no lo usa).
    if (data.rol !== "admin" && !data.usuario) {
        ctx.addIssue({ code: "custom", path: ["usuario"], message: "El usuario es requerido" });
    }
});
