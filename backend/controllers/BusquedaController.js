import { BadRequestError } from "../errors/AppError.js";

const hoy = () => new Date().toISOString().split("T")[0];

const enTreintaDias = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
};

const parseIdParam = (valor, nombre) => {
    const num = Number(valor);
    if (!Number.isInteger(num) || num <= 0)
        return new BadRequestError(`${nombre} debe ser un entero positivo`);
    return num;
};

export class BusquedaController {
    constructor({ busquedaService } = {}) {
        this.busquedaService = busquedaService;
    }

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

        const parsedPacienteId = parseIdParam(pacienteId, "pacienteId");
        if (parsedPacienteId instanceof BadRequestError)
            return next(parsedPacienteId);

        let parsedMedicoId = null;
        if (medicoId) {
            parsedMedicoId = parseIdParam(medicoId, "medicoId");
            if (parsedMedicoId instanceof BadRequestError)
                return next(parsedMedicoId);
        }

        if (!["fecha", "costo"].includes(ordenarPor))
            return next(new BadRequestError("ordenarPor debe ser 'fecha' o 'costo'"));

        if (!["asc", "desc"].includes(orden))
            return next(new BadRequestError("orden debe ser 'asc' o 'desc'"));

        const filtros = {
            pacienteId:   parsedPacienteId,
            medicoId:     parsedMedicoId,
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
