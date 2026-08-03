import { Router } from "express";
import { AuthController }      from "../controllers/AuthController.js";
import { AuthService }        from "../services/AuthService.js";
import { PacienteDemoService } from "../services/PacienteDemoService.js";
import { pacienteRepository, pacienteService } from "./pacienteRoutes.js";
import { medicoRepository, turnoRepository }   from "./medicoRoutes.js";
import { obraSocialService }                   from "./obraSocialRoutes.js";
import { avisoDisponibilidadRepository }       from "./avisoDisponibilidadRoutes.js";

const authRouter = Router();

// Reusa las MISMAS instancias de repositorio/service que el resto de la app.
const adminPassword = process.env.ADMIN_PASSWORD || "123456";

// Cuentas de prueba: necesita los repositorios de turnos y avisos para poder
// barrer el rastro de las cuentas vencidas, no solo la cuenta en sí.
const pacienteDemoService = new PacienteDemoService({
    pacienteRepository,
    turnoRepository,
    avisoDisponibilidadRepository,
    obraSocialService,
});

const authService    = new AuthService({
    pacienteRepository, medicoRepository, pacienteService, pacienteDemoService, adminPassword,
});
const authController  = new AuthController({ authService });

authRouter.post("/login",    authController.login);
authRouter.post("/registro", authController.registrarPaciente);
// Público y sin body: crea un invitado temporal y devuelve la sesión iniciada.
authRouter.post("/demo",     authController.sesionDemo);

export default authRouter;
