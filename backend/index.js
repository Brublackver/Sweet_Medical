import express from "express";
import medicosController from "./controllers/medicos.js";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", medicosController);

const puerto = 3000;
app.listen(puerto, () => {
  console.log("Sweet Medical API corriendo en puerto " + puerto);
});
