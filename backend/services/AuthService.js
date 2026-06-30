import { UnauthorizedError } from "../errors/AppError.js";
import { verifyPassword }    from "../auth/password.js";
import { firmarToken }       from "../auth/jwt.js";

/*
    SERVICE — Autenticación

    Valida credenciales y emite un JWT de sesión { tipo, id }. La identidad del
    usuario sale del token firmado, no de un id en texto plano.

    Por seguridad, el error es el MISMO cuando el usuario no existe y cuando la
    contraseña es incorrecta: así no se revela cuál de los dos falló.
*/

const TIPO_POR_ROL = { paciente: "PACIENTE", medico: "MEDICO" };
const CREDENCIALES_INVALIDAS = "Usuario o contraseña incorrectos";

export class AuthService {
    constructor({ pacienteRepository, medicoRepository, pacienteService, adminPassword } = {}) {
        this.pacienteRepository = pacienteRepository;
        this.medicoRepository   = medicoRepository;
        this.pacienteService    = pacienteService;
        this.adminPassword      = adminPassword;
    }

    // Auto-registro público: crea el paciente (con DNI único + hash, vía el
    // service) y devuelve la sesión ya iniciada, con el MISMO shape que login.
    // Re-consultamos por id para no devolver el hash (el doc recién guardado
    // lo tiene en memoria; la consulta lo excluye por select:false).
    registrarPaciente(datos) {
        return this.pacienteService.crear(datos)
            .then((paciente) => this.pacienteService.obtenerPorId(paciente.id))
            .then((entidad) => {
                const token = firmarToken({ tipo: "PACIENTE", id: entidad.id });
                return { token, tipo: "PACIENTE", usuario: entidad };
            });
    }

    login(rol, usuario, password) {
        if (rol === "admin") return this._loginAdmin(password);

        const repo = rol === "paciente" ? this.pacienteRepository : this.medicoRepository;

        return repo.obtenerCredencialPorUsuario(usuario)
            .then((credencial) => {
                if (!credencial)
                    return Promise.reject(new UnauthorizedError(CREDENCIALES_INVALIDAS));

                return verifyPassword(password, credencial.password).then((coincide) => {
                    if (!coincide)
                        return Promise.reject(new UnauthorizedError(CREDENCIALES_INVALIDAS));

                    const tipo  = TIPO_POR_ROL[rol];
                    const token = firmarToken({ tipo, id: credencial.id });

                    // Devolvemos la entidad pública (sin password, gracias a select:false)
                    // para que el front pueda mostrar nombre/datos sin otra request.
                    return repo.obtenerPorId(credencial.id)
                        .then((entidad) => ({ token, tipo, usuario: entidad }));
                });
            });
    }

    _loginAdmin(password) {
        if (!this.adminPassword || password !== this.adminPassword)
            return Promise.reject(new UnauthorizedError("Contraseña de administrador incorrecta"));
        const token = firmarToken({ tipo: "ADMIN", id: 0 });
        return Promise.resolve({ token, tipo: "ADMIN", usuario: { rol: "admin" } });
    }
}
