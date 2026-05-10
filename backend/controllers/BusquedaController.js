/*
    CONTROLLER — Capa de entrada HTTP para Búsqueda de Turnos

    Parsea y valida los query params antes de pasarlos al BusquedaService.
    Si no se especifica rango de fechas, usa hoy como inicio y 30 días como límite.
    Si no se especifica paginación, usa page=1 y limit=10.
*/

import mongoose            from "mongoose";
import { BadRequestError } from "../errors/AppError.js";

// Retorna la fecha de hoy en formato YYYY-MM-DD.
const hoy = () => new Date().toISOString().split("T")[0];

// Retorna la fecha de hoy + 30 días en formato YYYY-MM-DD.
const enTreintaDias = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
};

export class BusquedaController {
    constructor({ busquedaService } = {}) {
        this.busquedaService = busquedaService;
    }

    // GET /turno/buscar
    // Busca turnos disponibles aplicando los filtros y la paginación recibidos por query.
    // pacienteId es obligatorio — se usa para calcular la cobertura de su plan.
    // Filtros opcionales: medicoId, especialidad, practica, sede, fechaDesde, fechaHasta.
    // Paginación: page, limit (máx 100). Ordenamiento: ordenarPor=fecha|costo, orden=asc|desc.
    buscar = (req, res, next) => {
        const {
            pacienteId,
            medicoId,
            especialidad,
            practica,
            sede,
            fechaDesde,
            fechaHasta,
            page       = "1",
            limit      = "10",
            ordenarPor = "fecha",
            orden      = "asc",
        } = req.query;

        if (!pacienteId)
            return next(new BadRequestError("El parámetro pacienteId es requerido"));

        if (!mongoose.isValidObjectId(pacienteId))
            return next(new BadRequestError("pacienteId debe ser un ObjectId válido"));

        if (medicoId && !mongoose.isValidObjectId(medicoId))
            return next(new BadRequestError("medicoId debe ser un ObjectId válido"));

        if (!["fecha", "costo"].includes(ordenarPor))
            return next(new BadRequestError("ordenarPor debe ser 'fecha' o 'costo'"));

        if (!["asc", "desc"].includes(orden))
            return next(new BadRequestError("orden debe ser 'asc' o 'desc'"));

        const filtros = {
            pacienteId:   pacienteId,
            medicoId:     medicoId || null,
            especialidad: especialidad || null,
            practica:     practica     || null,
            sede:         sede         || null,
            fechaDesde:   fechaDesde   || hoy(),
            fechaHasta:   fechaHasta   || enTreintaDias(),
        };

        const paginacion = {
            page:      Math.max(1, parseInt(page)  || 1),
            limit:     Math.min(100, Math.max(1, parseInt(limit) || 10)),
            ordenarPor,
            orden,
        };

        return this.busquedaService.buscar(filtros, paginacion)
            .then((resultado) => res.status(200).json({ status: "success", data: resultado }))
            .catch(next);
    };
}
