export class BusquedaService {
    constructor({ medicoService, turnoService, pacienteService } = {}) {
        this.medicoService   = medicoService;
        this.turnoService    = turnoService;
        this.pacienteService = pacienteService;
    }

    buscar(filtros, paginacion) {
        return Promise.all([
            this.pacienteService.obtenerPorId(filtros.pacienteId),
            this.medicoService.obtenerTodos(),
        ])
        .then(([paciente, medicos]) => {
            const medicosFiltrados   = medicos.filter((m) => this._coincideFiltros(m, filtros));
            const medicosConServicio = medicosFiltrados.filter(
                (m) => this._serviciosDeMedico(m, filtros).length > 0
            );

            const promesas = medicosConServicio.flatMap((medico) => {
                const servicios = this._serviciosDeMedico(medico, filtros);
                const duracion  = medico.calcularDuracionSlot(filtros);
                const fechas    = this._rangoFechas(filtros.fechaDesde, filtros.fechaHasta);

                return fechas.map((fecha) =>
                    this.turnoService.buscarPorMedicoYFecha(medico.id, fecha)
                        .then((turnosDelDia) => {
                            const slots = medico.calcularSlotsDisponibles(fecha, duracion, turnosDelDia);
                            const sedes = medico.obtenerSedesConFiltro(filtros.sede);

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

    _coincideFiltros(medico, filtros) {
        if (filtros.medicoId    && medico.id !== filtros.medicoId)         return false;
        if (filtros.sede        && !medico.tieneSede(filtros.sede))        return false;
        if (filtros.especialidad && !medico.tieneEspecialidad(filtros.especialidad)) return false;
        if (filtros.practica    && !medico.tienePractica(filtros.practica)) return false;
        return true;
    }

    _serviciosDeMedico(medico, filtros) {
        const toDTO = (s, tipo) => ({
            id: s.id, codigo: s.codigo, nombre: s.nombre,
            duracionTurnoEnMins: s.duracionTurnoEnMins, costo: s.costo, tipo,
        });

        if (filtros.especialidad) {
            const esp = medico.obtenerEspecialidad(filtros.especialidad);
            return esp ? [toDTO(esp, "especialidad")] : [];
        }

        if (filtros.practica) {
            const prac = medico.obtenerPractica(filtros.practica);
            return prac ? [toDTO(prac, "practica")] : [];
        }

        return [
            ...medico.especialidades.map((e) => toDTO(e, "especialidad")),
            ...medico.practicas.map((p) => toDTO(p, "practica")),
        ];
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
