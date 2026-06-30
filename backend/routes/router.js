import { Router } from "express";

import medicoRouter      from "./medicoRoutes.js";
import turnoRouter       from "./turnoRoutes.js";
import pacienteRouter    from "./pacienteRoutes.js";
import sedeRouter        from "./sedeRoutes.js";
import obraSocialRouter  from "./obraSocialRoutes.js";
import busquedaRouter    from "./busquedaRoutes.js";
import healthcheckRouter from "./healthCheck.js";
import authRouter        from "./authRoutes.js";
import { requireAuth }   from "../middleware/authMiddleware.js";

const router = Router();

// Rutas públicas (no requieren sesión).
router.use("/healthcheck", healthcheckRouter);
router.use("/auth",        authRouter);
// El catálogo de obras sociales es público: el registro lo necesita ANTES de
// que el paciente tenga sesión (todavía no hay token).
router.use("/obra-social", obraSocialRouter);

// Rutas protegidas: exigen un Bearer token válido. La identidad sale del
// token (req.user), no de un id en texto plano.
router.use("/medico",   requireAuth, medicoRouter);
router.use("/turno",    requireAuth, turnoRouter);
router.use("/paciente", requireAuth, pacienteRouter);
router.use("/sede",     requireAuth, sedeRouter);
router.use("/turno",    requireAuth, busquedaRouter);

export default router;
