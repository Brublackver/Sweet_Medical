import express from "express";
import medicosRoutes from "./routes/medicos.routes.js";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", medicosRoutes);

export default app;