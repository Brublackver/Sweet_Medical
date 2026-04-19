import { Router } from "express";
import {MedicoController} from "../controllers/MedicoController.js";

const medicoRouter = Router();
const medicoController = new MedicoController();

medicoRouter.route("/:id/disponibilidad")
    .get((req, res) => medicoController.obtenerDisponibilidad(req, res))
    .post((req, res) => medicoController.definirDisponibilidad(req, res))
    .put((req, res) => medicoController.cambiarDisponibilidad(req, res))
    .delete((req, res) => medicoController.eliminarDisponibilidad(req, res))

export default medicoRouter;
