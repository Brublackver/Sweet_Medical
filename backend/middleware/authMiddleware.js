import { UnauthorizedError, ForbiddenError } from "../errors/AppError.js";
import { verificarToken } from "../auth/jwt.js";

/*
    Middleware de autenticación/autorización basada en JWT.

    requireAuth     → exige un Bearer token válido; deja req.user = { tipo, id }.
    requireOwnership→ exige que el :id de la ruta sea el del propio usuario
                      (y del tipo esperado): no podés operar como otro.
    requireAdmin    → exige rol ADMIN.
*/

export const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || "";
    const [esquema, token] = header.split(" ");

    if (esquema !== "Bearer" || !token)
        return next(new UnauthorizedError("Falta el token de autenticación"));

    try {
        const payload = verificarToken(token);
        req.user = { tipo: payload.tipo, id: payload.id };
        return next();
    } catch {
        return next(new UnauthorizedError("Token inválido o expirado"));
    }
};

export const requireOwnership = (tipoEsperado) => (req, res, next) => {
    if (!req.user)
        return next(new UnauthorizedError("No autenticado"));
    if (req.user.tipo !== tipoEsperado)
        return next(new ForbiddenError("No tenés permiso para acceder a este recurso"));
    if (Number(req.params.id) !== Number(req.user.id))
        return next(new ForbiddenError("Solo podés operar sobre tu propia cuenta"));
    return next();
};

export const requireAdmin = (req, res, next) => {
    if (!req.user)
        return next(new UnauthorizedError("No autenticado"));
    if (req.user.tipo !== "ADMIN")
        return next(new ForbiddenError("Acceso restringido a administradores"));
    return next();
};
