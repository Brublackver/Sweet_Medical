import { Router } from "express";

import medicoRouter from "./medicoRoutes.js"
import healthCheckRouter from "./healthCheck.js";

const router = Router()

// Configuración de paths bases para cada recurso
router.use('/medico', medicoRouter)
router.use('/healthCheck', healthCheckRouter)

export default router