import { DisponibilidadHoraria } from "./DisponibilidadHoraria.js";
import { GestorDisponibilidades } from "./GestorDisponibilidades.js";

export class Medico {
    constructor(id, usuario, matricula, nombre) {
        this.id = id;
        this.usuario = usuario.trim();
        this.matricula = matricula.trim();
        this.nombre = nombre.trim();
        this.especialidades = [];
        this.practicas = [];
        this.sedes = [];
        this.disponibilidades = [];
    }

    definirDisponibilidad({ diaSemana, horaDesde, horaHasta }) {
        const nueva = new DisponibilidadHoraria(diaSemana, horaDesde, horaHasta);
        this.disponibilidades = GestorDisponibilidades.definir(this.disponibilidades, nueva);
    }

    cambiarDisponibilidad({ diaSemana, horaDesde, horaHasta }) {
        const index = this.disponibilidades.findIndex(d => d.diaSemana === diaSemana);
        if (index === -1) return false;
        this.disponibilidades[index] = new DisponibilidadHoraria(diaSemana, horaDesde, horaHasta);
        return true;
    }

    tieneDisponibilidad(diaSemana, hora) {
        let i = this.disponibilidades.length - 1;
        while (i >= 0) {
            const slot = this.disponibilidades[i];
            if (slot.diaSemana === diaSemana && hora >= slot.horaDesde && hora < slot.horaHasta) {
                return true;
            }
            i--;
        }
        return false;
    }

    eliminarDisponibilidad() {
        this.disponibilidades = [];
    }

    obtenerDisponibilidadConTurnos(turnos) {
        const resultado = {};
        for (const disp of this.disponibilidades) {
            resultado[disp.diaSemana] = {
                horaDesde: disp.horaDesde,
                horaHasta: disp.horaHasta,
                turnosReservados: disp.turnosDelDia(turnos)
            };
        }
        return resultado;
    }
}
