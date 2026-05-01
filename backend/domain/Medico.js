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

    definirDisponibilidad({ fecha, horaDesde, horaHasta }) {
        const nueva = new DisponibilidadHoraria(fecha, horaDesde, horaHasta);
        this.disponibilidades = GestorDisponibilidades.definir(this.disponibilidades, nueva);
    }

    cambiarDisponibilidad({ fecha, horaDesde, horaHasta }) {
        const index = this.disponibilidades.findIndex(d => d.fecha === fecha);
        if (index === -1) return false;
        this.disponibilidades[index] = new DisponibilidadHoraria(fecha, horaDesde, horaHasta);
        return true;
    }

    tieneDisponibilidad(fecha, hora) {
        let i = this.disponibilidades.length - 1;
        while (i >= 0) {
            const slot = this.disponibilidades[i];
            if (slot.fecha === fecha && hora >= slot.horaDesde && hora < slot.horaHasta) {
                return true;
            }
            i--;
        }
        return false;
    }

    eliminarDisponibilidad() {
        this.disponibilidades = [];
    }

    obtenerDisponibilidadPorId(disponibilidadId) {
        return this.disponibilidades.find(d => d.id === disponibilidadId) || null;
    }

    eliminarDisponibilidadPorId(disponibilidadId) {
        const index = this.disponibilidades.findIndex(d => d.id === disponibilidadId);
        if (index === -1) return false;
        this.disponibilidades.splice(index, 1);
        return true;
    }

    obtenerDisponibilidadPorFecha(fecha, turnos) {
        return this.disponibilidades
            .filter(d => d.fecha === fecha)
            .map(d => ({
                id: d.id,
                horaDesde: d.horaDesde,
                horaHasta: d.horaHasta,
                turnosReservados: d.turnosDeFecha(turnos)
            }));
    }

    obtenerDisponibilidadConTurnos(turnos) {
        const resultado = {};
        for (const disp of this.disponibilidades) {
            resultado[disp.fecha] = {
                horaDesde: disp.horaDesde,
                horaHasta: disp.horaHasta,
                turnosReservados: disp.turnosDeFecha(turnos)
            };
        }
        return resultado;
    }
}
