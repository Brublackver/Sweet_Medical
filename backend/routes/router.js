import { Router } from "express";

import medicoRouter      from "./medicoRoutes.js";
import turnoRouter       from "./turnoRoutes.js";
import pacienteRouter    from "./pacienteRoutes.js";
import sedeRouter        from "./sedeRoutes.js";
import busquedaRouter    from "./busquedaRoutes.js";
import healthcheckRouter from "./healthCheck.js";

const router = Router();

router.use("/medico",      medicoRouter);
router.use("/turno",       turnoRouter);
router.use("/paciente",    pacienteRouter);
router.use("/sede",        sedeRouter);
router.use("/turno",       busquedaRouter);
router.use("/healthcheck", healthcheckRouter);

export default router;
