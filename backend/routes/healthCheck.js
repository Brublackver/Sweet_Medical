import { Router } from "express";

const healthCheckRouter = Router();

// GET /healthCheck → verifica que el servidor este corriendo
healthCheckRouter.get("/", (req, res) => {
    res.json({ status: "ok" });
});

export default healthCheckRouter;