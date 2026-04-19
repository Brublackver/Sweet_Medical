/*
    SERVICE — Capa de logica de negocio para Turnos
    Contiene las reglas de negocio:
    - Un turno solo se puede crear si el medico tiene disponibilidad ese dia/hora
    - Un turno solo se puede cancelar con al menos 1 hora de anticipacion
    - No se pueden crear turnos duplicados para el mismo medico y horario

    SERVICE --- DOMAIN
             |
         REPOSITORY
*/

import { TurnoRepository } from "../repositories/TurnoRepository.js";
import { MedicoRepository } from "../repositories/MedicoRepository.js";
import { NotFoundError, ConflictError, BadRequestError } from "../errors/AppError.js";

export class TurnoService {
    constructor({
        turnoRepository = new TurnoRepository(),
        medicoRepository = new MedicoRepository()
    } = {}) {
        this.turnoRepository = turnoRepository;
        this.medicoRepository = medicoRepository;
    }

    // Devuelve todos los turnos → Promise<Turno[]>
    // Viene de: TurnoController.obtenerTodos()
    // Va hacia: TurnoRepository.obtenerTodos()
    obtenerTodos() {
        return this.turnoRepository.obtenerTodos();
    }

    // Crea un turno validando disponibilidad del medico y que no haya duplicados → Promise<Turno>
    // Viene de: TurnoController.crearTurno() con datos validados por Zod
    // Recibe: { medicoId, pacienteId, fecha: "2026-04-21", hora: "10:00:00" }
    // Paso 1: Verifica que el medico exista en MedicoRepository
    // Paso 2: Verifica que el medico tenga disponibilidad en el dia/hora solicitado
    // Paso 3: Verifica que no exista un turno en el mismo horario para ese medico
    // Paso 4: Crea el turno en TurnoRepository
    crearTurno(datos) {
        return this.medicoRepository.obtenerPorId(datos.medicoId)
            .then((medico) => {
                if (!medico) {
                    return Promise.reject(new NotFoundError("Medico no encontrado"));
                }

                // Extraer el dia de la semana de la fecha solicitada
                const fechaTurno = new Date(datos.fecha + "T00:00:00");
                const diasSemana = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
                const diaSemana = diasSemana[fechaTurno.getDay()];

                // Extraer la hora como numero entero (ej: "10:00:00" → 10)
                const hora = parseInt(datos.hora.split(":")[0]);

                // Verificar que el medico tenga disponibilidad ese dia y en ese rango horario
                const disponibilidad = medico.obtenerDisponibilidad();
                const dispDelDia = disponibilidad[diaSemana];

                if (!dispDelDia) {
                    return Promise.reject(new BadRequestError(
                        "El medico no tiene disponibilidad el dia " + diaSemana
                    ));
                }

                if (hora < dispDelDia.horaDesde || hora >= dispDelDia.horaHasta) {
                    return Promise.reject(new BadRequestError(
                        "La hora del turno esta fuera del rango de disponibilidad (" + dispDelDia.horaDesde + ":00 - " + dispDelDia.horaHasta + ":00)"
                    ));
                }

                // Verificar que no exista un turno duplicado
                return this.turnoRepository.buscarPorMedicoFechaYHora(datos.medicoId, datos.fecha, datos.hora);
            })
            .then((turnoExistente) => {
                if (turnoExistente) {
                    return Promise.reject(new ConflictError("Ya existe un turno para ese medico en ese horario"));
                }

                return this.turnoRepository.crear(datos.medicoId, datos.pacienteId, datos.fecha, datos.hora);
            });
    }

    // Cancela un turno verificando que falte al menos 1 hora → Promise<boolean>
    // Viene de: TurnoController.cancelarTurno() con id validado
    // Paso 1: Verifica que el turno exista en TurnoRepository
    // Paso 2: Combina fecha + hora y calcula la diferencia con ahora
    // Paso 3: Si falta menos de 1 hora, rechaza con BadRequestError
    // Paso 4: Elimina el turno del TurnoRepository
    cancelarTurno(turnoId) {
        return this.turnoRepository.obtenerPorId(turnoId)
            .then((turno) => {
                if (!turno) {
                    return Promise.reject(new NotFoundError("Turno no encontrado"));
                }

                const ahora = new Date();
                const fechaTurno = new Date(turno.fecha + "T" + turno.hora);
                const diferenciaHoras = (fechaTurno - ahora) / (1000 * 60 * 60);

                if (diferenciaHoras < 1) {
                    return Promise.reject(new BadRequestError(
                        "No se puede cancelar el turno con menos de una hora de antelacion"
                    ));
                }

                return this.turnoRepository.eliminar(turnoId);
            });
    }
}
