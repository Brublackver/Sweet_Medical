/*
    CONTROLLER — Capa de entrada HTTP para Turnos
    Recibe el request del cliente (Postman, frontend, etc).
    Valida los datos externos (params, body) con Zod.
    Delega la logica de negocio al TurnoService.
    Devuelve la respuesta HTTP al cliente.

        CONTROLLER
             |
    SERVICE --- DOMAIN
*/

import { TurnoService } from "../services/TurnoService.js";
import * as z from "zod";
import { BadRequestError, NotFoundError, ConflictError } from "../errors/AppError.js";

// Schema de validacion para crear un turno
// medicoId y pacienteId deben ser enteros positivos
const crearTurnoSchema = z.object({
    medicoId: z.number().int().positive("El medicoId debe ser un entero positivo"),
    pacienteId: z.number().int().positive("El pacienteId debe ser un entero positivo"),
    fecha: z.string().date("El formato de fecha es invalido. Usar YYYY-MM-DD"),
    hora: z.string().regex(/^\d{2}:\d{2}$/, "El formato de hora es invalido. Usar HH:MM"),
});

export class TurnoController {
    constructor({
        turnoService = new TurnoService()
    } = {}) {
        this.turnoService = turnoService;
    }

    // Valida que el parametro id sea un entero positivo → number
    // Recibe: id (string) desde req.params.id
    // Si es invalido: lanza BadRequestError (no llega al Service)
    validarId(id) {
        const result = (z.number().int().positive()).safeParse(Number(id));
        if (!result.success) {
            throw new BadRequestError("El parametro id debe ser un entero positivo");
        }
        return result.data;
    }

    // GET /turno — Devuelve todos los turnos → res 200 con array de turnos
    // Viene de: turnoRoutes.js GET /
    // Va hacia: TurnoService.obtenerTodos() → TurnoRepository
    obtenerTodos = (req, res) => {
        return this.turnoService.obtenerTodos()
            .then((turnos) => {
                res.status(200).json({ status: "success", message: "Lista de todos los turnos", data: turnos });
            })
            .catch((error) => this.manejarError(res, error));
    }

    // POST /turno — Crea un nuevo turno validando disponibilidad → res 201
    // Viene de: turnoRoutes.js POST /
    // Valida body con crearTurnoSchema, luego va a TurnoService.crearTurno()
    // El Service se encarga de validar disponibilidad y duplicados
    crearTurno = (req, res) => {
        const validacion = crearTurnoSchema.safeParse(req.body);
        if (!validacion.success) {
            return Promise.resolve(
                res.status(400).json({ status: "fail", errores: validacion.error.errors })
            );
        }
        return this.turnoService.crearTurno(validacion.data)
            .then((turno) => {
                res.status(201).json({ status: "success", message: "Turno creado exitosamente", data: turno });
            })
            .catch((error) => this.manejarError(res, error));
    }

    // DELETE /turno/:id — Cancela un turno (solo si falta mas de 1 hora) → res 204
    // Viene de: turnoRoutes.js DELETE /:id
    // Valida id, luego va a TurnoService.cancelarTurno()
    // El Service se encarga de validar la restriccion de 1 hora
    cancelarTurno = (req, res) => {
        try {
            const id = this.validarId(req.params.id);
            return this.turnoService.cancelarTurno(id)
                .then(() => {
                    res.status(204).send();
                })
                .catch((error) => this.manejarError(res, error));
        } catch (error) {
            return this.manejarError(res, error);
        }
    }

    // Manejo centralizado de errores → respuesta HTTP con status y mensaje apropiados
    // Recibe: res (response de Express) y error (instancia de AppError o Error generico)
    // Mapea cada tipo de error a su status HTTP correspondiente
    manejarError(res, error) {
        const message = error?.message || "Error interno";
        const timestamp = error?.timestamp || new Date().toISOString();

        if (error instanceof BadRequestError) {
            return res.status(400).json({ status: "fail", message, timestamp });
        }

        if (error instanceof NotFoundError) {
            return res.status(404).json({ status: "fail", message, timestamp });
        }

        if (error instanceof ConflictError) {
            return res.status(409).json({ status: "fail", message, timestamp });
        }

        return res.status(500).json({ status: "error", message: "Error interno del servidor", timestamp });
    }
}
