/*
    ROUTER PRINCIPAL — Punto central de configuracion de rutas
    Registra todos los routers de cada recurso bajo su path base.
    app.js importa este router y lo monta en la aplicacion Express.
*/

import { Router } from "express";

import medicoRouter from "./medicoRoutes.js";
import turnoRouter from "./turnoRoutes.js";
import healthCheckRouter from "./healthCheck.js";

const router = Router();

// /medico → todas las rutas de medicos y su disponibilidad
router.use("/medico", medicoRouter);

// /turno → todas las rutas de turnos
router.use("/turno", turnoRouter);

// /healthCheck → endpoint de salud del servidor
router.use("/healthCheck", healthCheckRouter);

export default router;
