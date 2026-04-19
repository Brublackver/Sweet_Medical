import { Router } from "express";

const healthCheckRouter = Router();

// GET /api/medicos/:id/disponibilidad
healthCheckRouter.get("/", (req, res) => {
    res.json({ status: "ok" });
});

export default healthCheckRouter;