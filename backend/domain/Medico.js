import * as z from "zod";

const MedicoSchema = z.object({
    id: z.int().gt(0),
    usuario: z.string().max(30),
    nombre: z.string().max(30),
    matricula: z.string().max(30),
})

export class Medico {
    constructor(id, usuario, matricula, nombre) {
        this.id = id;
        this.usuario = usuario.trim();
        this.matricula = matricula.trim();
        this.nombre = nombre.trim();
        this.especialidades = [];
        this.practicas = [];
        this.sedes = [];
        this.disponibilidades = {};
    }

    definirDisponibilidad(disponibilidad) {
        this.eliminarDisponibilidad();
        this.disponibilidades[disponibilidad.diaSemana] = disponibilidad;
    }

    cambiarDisponibilidad(disponibilidad) {
        this.disponibilidades[disponibilidad.diaSemana] = disponibilidad;
    }

    eliminarDisponibilidad() {
        this.disponibilidades = {};
    }

    obtenerDisponibilidad() {
        return this.disponibilidades;
    }
}