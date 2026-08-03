import { validarLogin, validarRegistroPaciente } from "../validators/authValidator.js";

export class AuthController {
    constructor({ authService } = {}) {
        this.authService = authService;
    }

    // POST /auth/login  — body: { rol, usuario, password }
    login = (req, res, next) =>
        validarLogin(req.body)
            .then(({ rol, usuario, password }) => this.authService.login(rol, usuario, password))
            .then((data) => res.status(200).json({ status: "success", data }))
            .catch(next);

    // POST /auth/registro — auto-registro PÚBLICO de paciente.
    // Crea la cuenta y devuelve la sesión ya iniciada { token, tipo, usuario }.
    registrarPaciente = (req, res, next) =>
        validarRegistroPaciente(req.body)
            .then((datos) => this.authService.registrarPaciente(datos))
            .then((data) => res.status(201).json({ status: "success", data }))
            .catch(next);

    // POST /auth/demo — cuenta de prueba PÚBLICA, sin body ni credenciales.
    // Devuelve la sesión ya iniciada, igual que /login y /registro.
    sesionDemo = (req, res, next) =>
        this.authService.crearSesionDemo()
            .then((data) => res.status(201).json({ status: "success", data }))
            .catch(next);
}
