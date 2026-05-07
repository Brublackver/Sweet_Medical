import { DisponibilidadHoraria } from "./DisponibilidadHoraria.js";
import { GestorDisponibilidades } from "./GestorDisponibilidades.js";

// Convierte "HH:MM" a minutos desde medianoche.
// TRANSPARENCIA REFERENCIAL: función pura — sin efectos secundarios.
const horaAMinutos = (hora) => {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
};

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

    // REGLA DE NEGOCIO — Modificación de disponibilidad:
    // Los turnos ya reservados NO se tocan al cambiar la disponibilidad.
    // El cambio solo impacta en la generación de NUEVOS turnos.
    // Esto se garantiza por diseño: los turnos viven en TurnoRepository
    // y la disponibilidad en Medico. Cambiar una no altera la otra.
    cambiarDisponibilidad({ fecha, horaDesde, horaHasta }) {
        const index = this.disponibilidades.findIndex(d => d.fecha === fecha);
        if (index === -1) return false;
        this.disponibilidades[index] = new DisponibilidadHoraria(fecha, horaDesde, horaHasta);
        return true;
    }

    // Verifica que el slot completo [hora, hora + duracion] quede
    // dentro de algún bloque de disponibilidad del médico para esa fecha.
    //
    // Antes solo se chequeaba si la hora de inicio caía dentro del bloque.
    // Ahora también se verifica que la hora de FIN entre — un turno de 60 min
    // no puede empezar a las 11:30 si la disponibilidad termina a las 12:00
    // pero el turno terminaría a las 12:30.
    //
    // DECLARATIVIDAD: some() expresa la intención — "¿existe algún bloque
    // que contenga completamente el turno solicitado?" — sin detallar el loop.
    tieneDisponibilidad(fecha, hora, duracion) {
        const inicioEnMins = horaAMinutos(hora);
        const finEnMins    = inicioEnMins + duracion;

        return this.disponibilidades.some(disp =>
            disp.fecha === fecha &&
            horaAMinutos(disp.horaDesde) <= inicioEnMins &&
            horaAMinutos(disp.horaHasta) >= finEnMins
        );
    }

    // Verifica si alguno de los turnos de la fecha se superpone con
    // el slot solicitado [hora, hora + duracion).
    //
    // DELEGACIÓN + ENCAPSULAMIENTO: cada Turno sabe si se superpone
    // con un slot dado (seSuperponeConSlot). Medico solo orquesta —
    // no duplica la lógica de comparación de intervalos.
    //
    // DECLARATIVIDAD: some() reemplaza un loop imperativo con break.
    tieneConflictoConTurnos(hora, duracion, turnosDeLaFecha) {
        return turnosDeLaFecha.some(turno => turno.seSuperponeConSlot(hora, duracion));
    }

    // Genera todos los slots disponibles de `duracion` minutos para una fecha,
    // descartando los que se superponen con turnos ya ocupados.
    //
    // ALGORITMO: para cada bloque de disponibilidad de la fecha, se generan
    // slots consecutivos de `duracion` minutos desde horaDesde hasta horaHasta.
    // Luego se filtra cualquier slot que colisione con un turno activo.
    //
    // DECLARATIVIDAD + COMPOSICIÓN:
    //   flatMap → aplana disponibilidades a slots crudos
    //   filter  → descarta los ocupados delegando en Turno.seSuperponeConSlot
    calcularSlotsDisponibles(fecha, duracion, turnosOcupados) {
        const generarSlots = (horaDesde, horaHasta) => {
            const inicio = horaAMinutos(horaDesde);
            const fin    = horaAMinutos(horaHasta);
            const slots  = [];
            for (let t = inicio; t + duracion <= fin; t += duracion) {
                const hh = String(Math.floor(t / 60)).padStart(2, "0");
                const mm = String(t % 60).padStart(2, "0");
                slots.push(`${hh}:${mm}`);
            }
            return slots;
        };

        return this.disponibilidades
            .filter(d => d.fecha === fecha)
            .flatMap(d => generarSlots(d.horaDesde, d.horaHasta))
            .filter(slot => !turnosOcupados.some(t => t.seSuperponeConSlot(slot, duracion)));
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
