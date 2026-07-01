import { isAppointmentBookable } from "../domain/tiempo.js";

export class BusquedaService {
    constructor({ medicoService, turnoService, pacienteService } = {}) {
        this.medicoService   = medicoService;
        this.turnoService    = turnoService;
        this.pacienteService = pacienteService;
    }

    buscar(filtros) {
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
                            // Se excluyen los slots cuyo horario ya venció: un turno de
                            // hoy a la mañana no debe mostrarse a la tarde. La comparación
                            // usa hora de Argentina (isAppointmentBookable), consistente con
                            // la validación del backend al reservar.
                            const slots = medico
                                .calcularSlotsDisponibles(fecha, duracion, turnosDelDia)
                                .filter((hora) => isAppointmentBookable(fecha, hora));
                            const sedes = medico.obtenerSedesConFiltro(filtros.sede);

                            return slots.flatMap((hora) =>
                                servicios.map((servicio) => ({
                                    medico:   { id: medico.id, nombre: medico.nombre, matricula: medico.matricula },
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
                .then((resultadosPorFecha) => this._agruparPorDia(resultadosPorFecha.flat(), filtros.direccion));
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

    // Calcula la cobertura según el plan del paciente.
    // El plan define UN porcentaje general (coberturaGeneral, 0–100) que aplica a
    // todos los servicios. Regla de negocio: un plan con 0% igual bonifica un 10%
    // en las PRÁCTICAS (no en las especialidades).
    _calcularCobertura(paciente, servicio) {
        const plan = paciente.plan;
        if (!plan) return { cobertura: "NO_CUBIERTA", montoAbonar: servicio.costo };

        let nivel = plan.coberturaGeneral ?? 0;
        if (nivel === 0 && servicio.tipo === "practica") nivel = 10;

        if (nivel <= 0)
            return { cobertura: "NO_CUBIERTA", montoAbonar: servicio.costo };
        if (nivel >= 100)
            return { cobertura: "COMPLETA", montoAbonar: 0 };

        const monto = Math.round(servicio.costo * (1 - nivel / 100) * 100) / 100;
        return { cobertura: "PARCIAL", montoAbonar: monto };
    }

    // Genera todas las fechas (YYYY-MM-DD) entre desde y hasta inclusive.
    _rangoFechas(desde, hasta) {
        const fechas  = [];
        // Se itera en UTC (sufijo Z + setUTCDate) para que el listado de días sea
        // idéntico sin importar la zona horaria del servidor. Solo se usa la parte
        // "YYYY-MM-DD", por lo que no hay corrimiento posible de día.
        const current = new Date(`${desde}T00:00:00Z`);
        const end     = new Date(`${hasta}T00:00:00Z`);
        while (current <= end) {
            fechas.push(current.toISOString().split("T")[0]);
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return fechas;
    }

    // Agrupa los resultados por fecha. La dirección controla el orden de los días:
    // "asc" → del más cercano al más lejano; "desc" → del más lejano al más cercano.
    _agruparPorDia(resultados, direccion = "asc") {
        const grupos = {};
        for (const { fecha, ...resto } of resultados) {
            if (!grupos[fecha]) grupos[fecha] = [];
            grupos[fecha].push(resto);
        }
        const fechasOrdenadas = Object.keys(grupos).sort();
        if (direccion === "desc") fechasOrdenadas.reverse();
        return fechasOrdenadas.map((fecha) => {
            const turnos = grupos[fecha].sort((a, b) =>
                direccion === "asc" ? a.montoAbonar - b.montoAbonar : b.montoAbonar - a.montoAbonar
            );
            return { fecha, turnos };
        });
    }
}
