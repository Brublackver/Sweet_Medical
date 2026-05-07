/*
    ROUTER PRINCIPAL — Punto central de configuracion de rutas
    Registra todos los routers de cada recurso bajo su path base.
    app.js importa este router y lo monta en la aplicacion Express.
*/

import { Router } from "express";

import medicoRouter    from "./medicoRoutes.js";
import turnoRouter     from "./turnoRoutes.js";
import pacienteRouter  from "./pacienteRoutes.js";
import sedeRouter      from "./sedeRoutes.js";
import busquedaRouter  from "./busquedaRoutes.js";
import healthcheckRouter from "./healthcheck.js";

const router = Router();

router.use("/medico",      medicoRouter);
router.use("/turno",       turnoRouter);
router.use("/paciente",    pacienteRouter);
router.use("/sede",        sedeRouter);
router.use("/turno",       busquedaRouter);
router.use("/healthcheck", healthcheckRouter);

export default router;
