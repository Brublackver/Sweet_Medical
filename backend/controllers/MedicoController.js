/*
        CONTROLLER
             |
    SERVICE --- DOMAIN


    Validaciones externas
 */

import {MedicoService} from "../services/MedicoService.js";
import * as z from "zod";
import {BadRequestError, NotFoundError} from "../errors/AppError.js";
import {DisponibilidadHorariaSchema} from "../domain/DisponibilidadHoraria.js";

export class MedicoController {
    constructor({
        medicoService = new MedicoService()
    } = {}) {
        this.medicoService = medicoService;
    }

    validarId(id) {
        const result = (z.int().gt(0)).safeParse(Number(id));
        if (!result.success) {
            throw new BadRequestError('El parametro id debe ser un entero positivo');
        } else {
            return result.data
        }
    }

    validarDisponibilidad(disponibilidad) {
        const result = DisponibilidadHorariaSchema.safeParse(disponibilidad);
        if (!result.success) {
            throw new BadRequestError("La disponibilidad debe tener otro formato");
        }
        return result.data
    }

    obtenerDisponibilidad = async (req, res) => {
        try {
            const id = this.validarId(req.params.id);
            const disponibilidad = this.medicoService.obtenerDisponibilidad(id);
            return res.status(200).json({ status: "success", data: disponibilidad });
        } catch (error) {
            return this.manejarError(res, error)
        }
    }

    definirDisponibilidad = async (req, res) => {
        try {
            const id = this.validarId(req.params.id);
            const body = this.validarDisponibilidad(req.body);
            this.medicoService.definirDisponibilidad(id, body);
            return res.status(201).json({ status: "success" });
        } catch (error) {
            return this.manejarError(res, error)
        }
    }

    cambiarDisponibilidad = async (req, res) => {
        try {
            const id = this.validarId(req.params.id);
            const body = this.validarDisponibilidad(req.body);
            this.medicoService.cambiarDisponibilidad(id, body);
            return res.status(204).json({ status: "success" });
        } catch (error) {
            return this.manejarError(res, error)
        }
    }

    eliminarDisponibilidad = async (req, res) => {
        try {
            const id = this.validarId(req.params.id);
            this.medicoService.eliminarDisponibilidad(id);
            return res.status(204).json({ status: "success" });
        } catch (error) {
            return this.manejarError(res, error)
        }
    }

    manejarError(res, error) {
        const message = error?.message || "Error interno";
        const timestamp = error?.timestamp || new Date().toISOString()

        if (error instanceof BadRequestError) {
            return res.status(400).json({ status: "fail", message, timestamp })
        }

        if (error instanceof NotFoundError) {
            return res.status(404).json({ status: "fail", message, timestamp })
        }

        return res.status(500).json({ status: "error", message: "Error interno del servidor", timestamp })
    }
}