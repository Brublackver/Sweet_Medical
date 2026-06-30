import { describe, it, expect } from "@jest/globals";
import { AuthService }          from "../services/AuthService.js";
import { hashPassword }         from "../auth/password.js";
import { verificarToken }       from "../auth/jwt.js";

// Fake mínimo de un repo con credencial: respeta obtenerCredencialPorUsuario
// (devuelve el hash) y obtenerPorId (entidad pública, sin password).
const fakeRepo = ({ usuario, hash, id = 1, entidad = {} }) => ({
    obtenerCredencialPorUsuario: (u) =>
        Promise.resolve(u === usuario ? { id, usuario, password: hash } : null),
    obtenerPorId: (i) =>
        Promise.resolve(i === id ? { id, usuario, ...entidad } : null),
});

describe("AuthService - login", () => {

    it("emite un token válido con tipo e id al loguear con credenciales correctas", () => {
        return hashPassword("secreta123").then((hash) => {
            const pacienteRepository = fakeRepo({ usuario: "jperez", hash, id: 7, entidad: { nombre: "Juan" } });
            const auth = new AuthService({ pacienteRepository });

            return auth.login("paciente", "jperez", "secreta123").then((res) => {
                expect(res.tipo).toBe("PACIENTE");
                expect(res.usuario.nombre).toBe("Juan");
                const payload = verificarToken(res.token);
                expect(payload.tipo).toBe("PACIENTE");
                expect(payload.id).toBe(7);
            });
        });
    });

    it("rechaza con 401 si la contraseña es incorrecta", () => {
        return hashPassword("correcta").then((hash) => {
            const pacienteRepository = fakeRepo({ usuario: "jperez", hash });
            const auth = new AuthService({ pacienteRepository });

            return auth.login("paciente", "jperez", "incorrecta")
                .then(() => { throw new Error("Debería haber rechazado"); })
                .catch((err) => expect(err.message).toMatch(/incorrect/i));
        });
    });

    it("usa el mismo mensaje cuando el usuario no existe (no revela cuál falló)", () => {
        const pacienteRepository = fakeRepo({ usuario: "otro", hash: "x" });
        const auth = new AuthService({ pacienteRepository });

        return auth.login("paciente", "noexiste", "loquesea")
            .then(() => { throw new Error("Debería haber rechazado"); })
            .catch((err) => expect(err.message).toMatch(/incorrect/i));
    });

    it("loguea al admin con la contraseña configurada y emite token ADMIN", () => {
        const auth = new AuthService({ adminPassword: "secreta-admin" });

        return auth.login("admin", "", "secreta-admin").then((res) => {
            expect(res.tipo).toBe("ADMIN");
            expect(verificarToken(res.token).tipo).toBe("ADMIN");
        });
    });
});
