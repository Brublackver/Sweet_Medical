import jwt from "jsonwebtoken";

/*
    Firma y verificación de JSON Web Tokens.

    El payload de sesión es { tipo, id }: el backend deriva la identidad del
    usuario del token firmado, NO de un id en texto plano en la URL.

    El secreto sale de la variable de entorno JWT_SECRET. El fallback es solo
    para desarrollo: en producción JWT_SECRET DEBE estar definido.
*/

const SECRET  = process.env.JWT_SECRET || "sweet-medical-dev-secret-cambiar-en-produccion";
const EXPIRA  = process.env.JWT_EXPIRA || "8h";

export const firmarToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRA });

// Lanza un JsonWebTokenError/TokenExpiredError si el token es inválido o expiró.
export const verificarToken = (token) => jwt.verify(token, SECRET);
