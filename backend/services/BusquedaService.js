/*
    SERVICE — Búsqueda de turnos disponibles

    Orquesta la búsqueda de slots libres cruzando disponibilidad del médico,
    turnos ya ocupados y cobertura del paciente.

    SEPARACIÓN DE RESPONSABILIDADES:
    - El cálculo de slots libres vive en Medico.calcularSlotsDisponibles (dominio)
    - El cálculo de cobertura es responsabilidad de este service (regla de negocio de búsqueda)
    - Paginación y ordenamiento son responsabilidades de presentación, delegadas aquí

    COBERTURA — nivel es un porcentaje (0–100):
      100 → COMPLETA  → montoAbonar = 0
      1–99 → PARCIAL  → montoAbonar = costo * (1 - nivel/100)
      0    → NO_CUBIERTA → montoAbonar = costo (precio completo)
    Si el plan no cubre el servicio → NO_CUBIERTA
*/

import { NotFoundError } from "../errors/AppError.js";

export class BusquedaService {
    constructor({ medicoRepository, turnoRepository, pacienteRepository } = {}) {
        this.medicoRepository   = medicoRepository;
        this.turnoRepository    = turnoRepository;
        this.pacienteRepository = pacienteRepository;
    }

    buscar(filtros, paginacion) {
        return Promise.all([
            this.pacienteRepository.obtenerPorId(filtros.pacienteId),
            this.medicoRepository.obtenerTodos(),
        ])
        .then(([paciente, medicos]) => {
            if (!paciente)
                return Promise.reject(new NotFoundError("Paciente no encontrado"));

            const medicosFiltrados = medicos.filter((m) => this._coincideFiltros(m, filtros));
            const medicosConServicio = medicosFiltrados.filter(
                (m) => this._serviciosDeMedico(m, filtros).length > 0
            );

            const promesas = medicosConServicio.flatMap((medico) => {
                const servicios = this._serviciosDeMedico(medico, filtros);
                const duracion  = this._duracionSlot(medico, filtros);
                const fechas    = this._rangoFechas(filtros.fechaDesde, filtros.fechaHasta);

                return fechas.map((fecha) =>
                    this.turnoRepository.buscarPorMedicoYFecha(medico.id, fecha)
                        .then((turnosDelDia) => {
                            const slots = medico.calcularSlotsDisponibles(fecha, duracion, turnosDelDia);
                            const sedes = this._sedesDelMedico(medico, filtros.sede);

                            return slots.flatMap((hora) =>
                                servicios.map((servicio) => ({
                                    medico:     { id: medico.id, nombre: medico.nombre, matricula: medico.matricula },
                                    servicio,
                                    fecha,
                                    hora,
                                    sedes,
                                    ...this._calcularCobertura(paciente, servicio),
                                }))
                            );
                        })
                );
            });

            return Promise.all(promesas)
                .then((resultadosPorFecha) => {
                    const todos = resultadosPorFecha.flat();
                    return this._paginar(this._ordenar(todos, paginacion), paginacion);
                });
        });
    }

    // --- Helpers privados -------------------------------------------------------

    // Filtra médicos que cumplan TODOS los criterios de búsqueda.
    _coincideFiltros(medico, filtros) {
        if (filtros.medicoId && medico.id !== filtros.medicoId)    return false;
        if (filtros.sede      && !this._tieneSede(medico, filtros.sede))        return false;
        if (filtros.especialidad && !this._tieneEspecialidad(medico, filtros.especialidad)) return false;
        if (filtros.practica     && !this._tienePractica(medico, filtros.practica))         return false;
        return true;
    }

    _tieneSede(medico, nombre) {
        return medico.sedes.some((s) => s.nombre.toLowerCase() === nombre.toLowerCase());
    }

    _tieneEspecialidad(medico, valor) {
        return medico.especialidades.some(
            (e) => e.nombre.toLowerCase() === valor.toLowerCase() || e.codigo === valor.toUpperCase()
        );
    }

    _tienePractica(medico, valor) {
        return medico.practicas.some(
            (p) => p.nombre.toLowerCase() === valor.toLowerCase() || p.codigo === valor.toUpperCase()
        );
    }

    // Devuelve los servicios del médico que aplican al filtro, con `tipo` adjunto.
    _serviciosDeMedico(medico, filtros) {
        const toDTO = (s, tipo) => ({
            id: s.id, codigo: s.codigo, nombre: s.nombre,
            duracionTurnoEnMins: s.duracionTurnoEnMins, costo: s.costo, tipo,
        });

        if (filtros.especialidad) {
            const esp = medico.especialidades.find(
                (e) => e.nombre.toLowerCase() === filtros.especialidad.toLowerCase()
                    || e.codigo === filtros.especialidad.toUpperCase()
            );
            return esp ? [toDTO(esp, "especialidad")] : [];
        }

        if (filtros.practica) {
            const prac = medico.practicas.find(
                (p) => p.nombre.toLowerCase() === filtros.practica.toLowerCase()
                    || p.codigo === filtros.practica.toUpperCase()
            );
            return prac ? [toDTO(prac, "practica")] : [];
        }

        return [
            ...medico.especialidades.map((e) => toDTO(e, "especialidad")),
            ...medico.practicas.map((p) => toDTO(p, "practica")),
        ];
    }

    // Duración del slot: la del servicio filtrado, o la máxima del médico si no hay filtro.
    _duracionSlot(medico, filtros) {
        if (filtros.especialidad) {
            const esp = medico.especialidades.find(
                (e) => e.nombre.toLowerCase() === filtros.especialidad.toLowerCase()
                    || e.codigo === filtros.especialidad.toUpperCase()
            );
            return esp?.duracionTurnoEnMins ?? 30;
        }

        if (filtros.practica) {
            const prac = medico.practicas.find(
                (p) => p.nombre.toLowerCase() === filtros.practica.toLowerCase()
                    || p.codigo === filtros.practica.toUpperCase()
            );
            return prac?.duracionTurnoEnMins ?? 30;
        }

        const todas = [
            ...medico.especialidades.map((e) => e.duracionTurnoEnMins),
            ...medico.practicas.map((p) => p.duracionTurnoEnMins),
        ].filter(Boolean);

        return todas.length ? Math.max(...todas) : 30;
    }

    // Sedes a mostrar: si hay filtro, solo esa sede; si no, todas las del médico.
    _sedesDelMedico(medico, filtroSede) {
        if (!filtroSede) return medico.sedes;
        return medico.sedes.filter((s) => s.nombre.toLowerCase() === filtroSede.toLowerCase());
    }

    // Calcula cobertura según el plan del paciente.
    // nivel (0–100) = porcentaje que cubre la obra social.
    _calcularCobertura(paciente, servicio) {
        const plan = paciente.plan;
        if (!plan) return { cobertura: "NO_CUBIERTA", montoAbonar: servicio.costo };

        const coberturas = servicio.tipo === "especialidad"
            ? plan.coberturasEspecialidad
            : plan.coberturasPractica;

        const match = coberturas?.find((c) => {
            const item = servicio.tipo === "especialidad" ? c.especialidad : c.practica;
            return item?.codigo === servicio.codigo;
        });

        if (!match || match.nivel === 0)
            return { cobertura: "NO_CUBIERTA", montoAbonar: servicio.costo };
        if (match.nivel >= 100)
            return { cobertura: "COMPLETA", montoAbonar: 0 };

        const monto = Math.round(servicio.costo * (1 - match.nivel / 100) * 100) / 100;
        return { cobertura: "PARCIAL", montoAbonar: monto };
    }

    // Genera todas las fechas (YYYY-MM-DD) entre desde y hasta inclusive.
    _rangoFechas(desde, hasta) {
        const fechas  = [];
        const current = new Date(`${desde}T00:00:00`);
        const end     = new Date(`${hasta}T00:00:00`);
        while (current <= end) {
            fechas.push(current.toISOString().split("T")[0]);
            current.setDate(current.getDate() + 1);
        }
        return fechas;
    }

    _ordenar(resultados, { ordenarPor, orden }) {
        const factor = orden === "desc" ? -1 : 1;
        return [...resultados].sort((a, b) => {
            if (ordenarPor === "costo") return factor * (a.montoAbonar - b.montoAbonar);
            return factor * (new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`));
        });
    }

    _paginar(resultados, { page, limit }) {
        const inicio = (page - 1) * limit;
        return {
            total:      resultados.length,
            page,
            limit,
            totalPages: Math.ceil(resultados.length / limit),
            resultados: resultados.slice(inicio, inicio + limit),
        };
    }
}
