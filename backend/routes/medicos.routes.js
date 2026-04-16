import { Router } from "express";

const router = Router();

// GET /api/medicos/:id/disponibilidad
router.get("/medicos/:id/disponibilidad", (req, res) => {
  res.json({ message: ": obtener disponibilidad" });
});

// POST /api/medicos/:id/disponibilidad
router.post("/medicos/:id/disponibilidad", (req, res) => {
  res.status(201).json({ message: ": crear disponibilidad" });
});

// PUT /api/medicos/:id/disponibilidad/:dispId
router.put("/medicos/:id/disponibilidad/:dispId", (req, res) => {
  res.json({ message: ": actualizar disponibilidad" });
});

// DELETE /api/medicos/:id/disponibilidad/:dispId
router.delete("/medicos/:id/disponibilidad/:dispId", (req, res) => {
  res.status(204).send();
});

export default router;
