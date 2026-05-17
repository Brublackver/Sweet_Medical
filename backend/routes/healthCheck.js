import { Router } from "express";

const healthcheckRouter = Router();

// GET /healthcheck → verifica que el servidor este corriendo
healthcheckRouter.get("/", (req, res) => {
  res.json({ status: "ok" });
});

export default healthcheckRouter;
