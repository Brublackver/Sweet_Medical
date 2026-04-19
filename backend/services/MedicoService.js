/*
    SERVICE --- DOMAIN
             |
         REPOSITORY

    Validaciones internas
*/

import { MedicoRepository } from "../repositories/MedicoRepository.js"
import {NotFoundError} from "../errors/AppError.js";
import {DisponibilidadHoraria} from "../domain/DisponibilidadHoraria.js";

export class MedicoService {
    constructor({
        medicoRepository = new MedicoRepository()
    } = {}) {
        this.medicoRepository = medicoRepository;
    }

    validarMedico(id) {
        const medico = this.medicoRepository.obtenerPorId(id);
        if (!medico) {
            throw new NotFoundError("Medico no encontrado");
        }
        return medico;
    }

    obtenerDisponibilidad(id) {
        const medico = this.validarMedico(id);
        const disponibilidad = medico.obtenerDisponibilidad();
        return disponibilidad;
    }

    definirDisponibilidad(id, body) {
        const medico = this.validarMedico(id);
        const disponibilidad = new DisponibilidadHoraria(
            body.diaSemana,
            body.horaDesde,
            body.horaHasta
        );
        medico.definirDisponibilidad(disponibilidad)
    }

    cambiarDisponibilidad(id, body) {
        const medico = this.validarMedico(id);
        const disponibilidad = new DisponibilidadHoraria(
            body.diaSemana,
            body.horaDesde,
            body.horaHasta
        );
        medico.cambiarDisponibilidad(disponibilidad)
    }

    eliminarDisponibilidad(id) {
        const medico = this.validarMedico(id);
        medico.eliminarDisponibilidad()
    }
}