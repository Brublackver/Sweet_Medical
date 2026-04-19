/*
    CONTROLLER — Capa de entrada HTTP
    Recibe el request del cliente (Postman, frontend, etc).
    Valida los datos externos (params, body) con Zod.
    Delega la logica de negocio al Service.
    Devuelve la respuesta HTTP al cliente.

        CONTROLLER
             |
    SERVICE --- DOMAIN
*/

import { MedicoService } from "../services/MedicoService.js";
import * as z from "zod";
import { BadRequestError, NotFoundError, ConflictError } from "../errors/AppError.js";
import { DisponibilidadHorariaSchema } from "../domain/DisponibilidadHoraria.js";

// Schema de validacion para crear un medico
// Se usa en crearMedico() para validar el body del request
const crearMedicoSchema = z.object({
    usuario: z.string().min(1, "El usuario es obligatorio").max(30),
    nombre: z.string().min(1, "El nombre es obligatorio").max(30),
    matricula: z.string().min(1, "La matricula es obligatoria").max(30),
});

export class MedicoController {
    constructor({
        medicoService = new MedicoService()
    } = {}) {
        this.medicoService = medicoService;
    }

    // Valida que el parametro id sea un entero positivo → number
    // Recibe: id (string) desde req.params.id
    // Si es invalido: lanza BadRequestError (no llega al Service)
    validarId(id) {
        const result = (z.int().gt(0)).safeParse(Number(id));
        if (!result.success) {
            throw new BadRequestError("El parametro id debe ser un entero positivo");
        }
        return result.data;
    }

    // Valida el body de disponibilidad contra el schema de Zod → objeto validado
    // Recibe: disponibilidad (object) desde req.body
    // Si es invalido: lanza BadRequestError (no llega al Service)
    validarDisponibilidad(disponibilidad) {
        const result = DisponibilidadHorariaSchema.safeParse(disponibilidad);
        if (!result.success) {
            throw new BadRequestError("La disponibilidad debe tener el formato: { diaSemana, horaDesde, horaHasta }");
        }
        return result.data;
    }

    // GET /medico — Devuelve todos los medicos → res 200 con array de medicos
    // Viene de: medicoRoutes.js GET /
    // Va hacia: MedicoService.obtenerTodos() → MedicoRepository
    obtenerTodos = (req, res) => {
        return this.medicoService.obtenerTodos()
            .then((medicos) => {
                res.status(200).json({ status: "success", data: medicos });
            })
            .catch((error) => this.manejarError(res, error));
    }

    // POST /medico — Crea un nuevo medico → res 201 con el medico creado
    // Viene de: medicoRoutes.js POST /
    // Valida body con crearMedicoSchema, luego va a MedicoService.crear()
    crearMedico = (req, res) => {
        const validacion = crearMedicoSchema.safeParse(req.body);
        if (!validacion.success) {
            return Promise.resolve(
                res.status(400).json({ status: "fail", errores: validacion.error.errors })
            );
        }
        return this.medicoService.crear(validacion.data)
            .then((medico) => {
                res.status(201).json({ status: "success", message: "Medico creado exitosamente", data: medico });
            })
            .catch((error) => this.manejarError(res, error));
    }

    // GET /medico/:id/disponibilidad — Devuelve la disponibilidad de un medico → res 200
    // Viene de: medicoRoutes.js GET /:id/disponibilidad
    // Valida id, luego va a MedicoService.obtenerDisponibilidad()
    obtenerDisponibilidad = (req, res) => {
        try {
            const id = this.validarId(req.params.id);
            return this.medicoService.obtenerDisponibilidad(id)
                .then((disponibilidad) => {
                    res.status(200).json({ status: "success", data: disponibilidad });
                })
                .catch((error) => this.manejarError(res, error));
        } catch (error) {
            return this.manejarError(res, error);
        }
    }

    // POST /medico/:id/disponibilidad — Define la disponibilidad de un medico → res 201
    // Viene de: medicoRoutes.js POST /:id/disponibilidad
    // Valida id y body, luego va a MedicoService.definirDisponibilidad()
    definirDisponibilidad = (req, res) => {
        try {
            const id = this.validarId(req.params.id);
            const body = this.validarDisponibilidad(req.body);
            return this.medicoService.definirDisponibilidad(id, body)
                .then(() => {
                    res.status(201).json({ status: "success" });
                })
                .catch((error) => this.manejarError(res, error));
        } catch (error) {
            return this.manejarError(res, error);
        }
    }

    // PUT /medico/:id/disponibilidad — Cambia la disponibilidad de un dia → res 204
    // Viene de: medicoRoutes.js PUT /:id/disponibilidad
    // Valida id y body, luego va a MedicoService.cambiarDisponibilidad()
    cambiarDisponibilidad = (req, res) => {
        try {
            const id = this.validarId(req.params.id);
            const body = this.validarDisponibilidad(req.body);
            return this.medicoService.cambiarDisponibilidad(id, body)
                .then(() => {
                    res.status(204).send();
                })
                .catch((error) => this.manejarError(res, error));
        } catch (error) {
            return this.manejarError(res, error);
        }
    }

    // DELETE /medico/:id/disponibilidad — Elimina toda la disponibilidad → res 204
    // Viene de: medicoRoutes.js DELETE /:id/disponibilidad
    // Valida id, luego va a MedicoService.eliminarDisponibilidad()
    eliminarDisponibilidad = (req, res) => {
        try {
            const id = this.validarId(req.params.id);
            return this.medicoService.eliminarDisponibilidad(id)
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
