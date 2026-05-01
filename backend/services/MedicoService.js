/*
    SERVICE — Capa de logica de negocio
    Recibe datos validados externamente desde el Controller.
    Aplica reglas de negocio y delega el acceso a datos al Repository.

    SERVICE --- DOMAIN
             |
         REPOSITORY
*/

import { NotFoundError, BadRequestError } from "../errors/AppError.js";

export class MedicoService {
    constructor({ medicoRepository, turnoService} = {}) {
        this.medicoRepository = medicoRepository;
        this.turnoService = turnoService;
    }

    // Verifica que el medico exista en el repository → Promise<Medico>
    // Recibe: id (number) desde cualquier metodo de este service
    // Si no existe: rechaza la Promise con NotFoundError

    obtenerPorId(id) {
        return this.medicoRepository.obtenerPorId(id)
            .then((medico) => {
                if (!medico) {
                    return Promise.reject(new NotFoundError("Medico no encontrado"));
                }
                return medico;
            });
    }

    // Devuelve todos los medicos → Promise<Medico[]>
    // Viene de: MedicoController.obtenerTodos()
    // Va hacia: MedicoRepository.obtenerTodos()
    obtenerTodos() {
        return this.medicoRepository.obtenerTodos();
    }

    // Crea un nuevo medico con los datos recibidos → Promise<Medico>
    // Viene de: MedicoController.crearMedico() con datos ya validados por Zod
    // Va hacia: MedicoRepository.crear()
    crear(datos) {
        return this.medicoRepository.crear(datos);
    }

    obtenerDisponibilidad(id) {
        let medico;
        return this.obtenerPorId(id)
            .then((m) => {
                medico = m;
                return this.turnoService.buscarPorMedico(id);
            })
            .then((turnos) => medico.obtenerDisponibilidadConTurnos(turnos));
    }

    obtenerDisponibilidadPorFecha(id, fecha) {
        let medico;
        return this.obtenerPorId(id)
            .then((m) => {
                medico = m;
                return this.turnoService.buscarPorMedico(id);
            })
            .then((turnos) => medico.obtenerDisponibilidadPorFecha(fecha, turnos));
    }

    // Define la disponibilidad de un medico (reemplaza la existente) → Promise<void>
    // Viene de: MedicoController.definirDisponibilidad() con id y body validados
    // Va hacia: Medico.definirDisponibilidad() (metodo del dominio)
    // Podríamos cambiar esta implementación en un futuro para que las disponibilidades sea un array de varios dias con sus respectivos horarios.
    definirDisponibilidad(id, body) {
        return this.obtenerPorId(id)
            .then((medico) => {
                medico.definirDisponibilidad(body);
            });
    }

    cambiarDisponibilidad(id, body) {
        return this.obtenerPorId(id)
            .then((medico) => {
                const cambiado = medico.cambiarDisponibilidad(body);
                if (!cambiado) {
                    return Promise.reject(new BadRequestError("No existe disponibilidad para la fecha " + body.fecha));
                }
            });
    }

    obtenerDisponibilidadPorId(medicoId, disponibilidadId) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                const disp = medico.obtenerDisponibilidadPorId(disponibilidadId);
                if (!disp) {
                    return Promise.reject(new NotFoundError("Disponibilidad no encontrada"));
                }
                return disp;
            });
    }

    eliminarDisponibilidadPorId(medicoId, disponibilidadId) {
        return this.obtenerPorId(medicoId)
            .then((medico) => {
                const eliminado = medico.eliminarDisponibilidadPorId(disponibilidadId);
                if (!eliminado) {
                    return Promise.reject(new NotFoundError("Disponibilidad no encontrada"));
                }
            });
    }
}
