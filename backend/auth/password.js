import bcrypt from "bcryptjs";

/*
    Hashing de contraseñas con bcrypt.

    NUNCA se guarda la contraseña en texto plano: se almacena solo el hash.
    bcrypt incorpora el salt dentro del propio hash, por eso no hace falta
    guardarlo aparte.
*/

const SALT_ROUNDS = 10;

export const hashPassword = (plano) => bcrypt.hash(plano, SALT_ROUNDS);

export const verifyPassword = (plano, hash) => {
    if (!hash) return Promise.resolve(false);
    return bcrypt.compare(plano, hash);
};
