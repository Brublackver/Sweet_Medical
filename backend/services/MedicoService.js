/*
    SERVICE — Capa de logica de negocio
    Recibe datos validados externamente desde el Controller.
    Aplica reglas de negocio y delega el acceso a datos al Repository.

    SERVICE --- DOMAIN
             |
         REPOSITORY
*/

import { MedicoRepository } from "../repositories/MedicoRepository.js";
import { NotFoundError } from "../errors/AppError.js";
import { DisponibilidadHoraria } from "../domain/DisponibilidadHoraria.js";

export class MedicoService {
    constructor({
        medicoRepository = new MedicoRepository()
    } = {}) {
        this.medicoRepository = medicoRepository;
    }

    // Verifica que el medico exista en el repository → Promise<Medico>
    // Recibe: id (number) desde cualquier metodo de este service
    // Si no existe: rechaza la Promise con NotFoundError
    validarMedico(id) {
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

    // Obtiene la disponibilidad horaria de un medico → Promise<Object>
    // Viene de: MedicoController.obtenerDisponibilidad() con id validado
    // Va hacia: Medico.obtenerDisponibilidad() (metodo del dominio)
    obtenerDisponibilidad(id) {
        return this.validarMedico(id)
            .then((medico) => {
                return medico.obtenerDisponibilidad();
            });
    }

    // Define la disponibilidad de un medico (reemplaza la existente) → Promise<void>
    // Viene de: MedicoController.definirDisponibilidad() con id y body validados
    // Va hacia: Medico.definirDisponibilidad() (metodo del dominio)
    definirDisponibilidad(id, body) {
        return this.validarMedico(id)
            .then((medico) => {
                const disponibilidad = new DisponibilidadHoraria(
                    body.diaSemana,
                    body.horaDesde,
                    body.horaHasta
                );
                medico.definirDisponibilidad(disponibilidad);
            });
    }

    // Cambia la disponibilidad de un dia especifico sin borrar las demas → Promise<void>
    // Viene de: MedicoController.cambiarDisponibilidad() con id y body validados
    // Va hacia: Medico.cambiarDisponibilidad() (metodo del dominio)
    cambiarDisponibilidad(id, body) {
        return this.validarMedico(id)
            .then((medico) => {
                const disponibilidad = new DisponibilidadHoraria(
                    body.diaSemana,
                    body.horaDesde,
                    body.horaHasta
                );
                medico.cambiarDisponibilidad(disponibilidad);
            });
    }

    // Elimina toda la disponibilidad de un medico → Promise<void>
    // Viene de: MedicoController.eliminarDisponibilidad() con id validado
    // Va hacia: Medico.eliminarDisponibilidad() (metodo del dominio)
    eliminarDisponibilidad(id) {
        return this.validarMedico(id)
            .then((medico) => {
                medico.eliminarDisponibilidad();
            });
    }
}
