import { Router } from "express";
import { AuthController }      from "../controllers/AuthController.js";
import { AuthService }        from "../services/AuthService.js";
import { pacienteRepository, pacienteService } from "./pacienteRoutes.js";
import { medicoRepository }   from "./medicoRoutes.js";

const authRouter = Router();

// Reusa las MISMAS instancias de repositorio/service que el resto de la app.
const adminPassword = process.env.ADMIN_PASSWORD || "123456";
const authService    = new AuthService({ pacienteRepository, medicoRepository, pacienteService, adminPassword });
const authController  = new AuthController({ authService });

authRouter.post("/login",    authController.login);
authRouter.post("/registro", authController.registrarPaciente);

export default authRouter;
