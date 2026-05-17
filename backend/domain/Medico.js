import { DisponibilidadHoraria } from "./DisponibilidadHoraria.js";
import { GestorDisponibilidades } from "./GestorDisponibilidades.js";
import { Especialidad }           from "./Especialidad.js";
import { Practica }               from "./Practica.js";
import { horaAMinutos }           from "./tiempo.js";

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
        const maxId = this.disponibilidades.reduce((max, d) => Math.max(max, d.id || 0), 0);
        let nextId = maxId + 1;
        for (const d of this.disponibilidades) {
            if (!d.id) d.id = nextId++;
        }
    }

    // REGLA DE NEGOCIO — Modificación de disponibilidad:
    // Los turnos ya reservados NO se tocan al cambiar la disponibilidad.
    // El cambio solo impacta en la generación de NUEVOS turnos.
    // Esto se garantiza por diseño: los turnos viven en TurnoRepository
    // y la disponibilidad en Medico. Cambiar una no altera la otra.
    cambiarDisponibilidad({ fecha, horaDesde, horaHasta }) {
        const index = this.disponibilidades.findIndex(d => d.fecha === fecha);
        if (index === -1) return false;
        const oldId = this.disponibilidades[index].id;
        this.disponibilidades[index] = new DisponibilidadHoraria(fecha, horaDesde, horaHasta);
        this.disponibilidades[index].id = oldId;
        return true;
    }

    // El turno debe caber entero: un turno de 60 min que empieza a las 11:30
    // no es válido si la disponibilidad termina a las 12:00.
    tieneDisponibilidad(fecha, hora, duracion) {
        const inicioEnMins = horaAMinutos(hora);
        const finEnMins    = inicioEnMins + duracion;

        return this.disponibilidades.some(disp =>
            disp.fecha === fecha &&
            horaAMinutos(disp.horaDesde) <= inicioEnMins &&
            horaAMinutos(disp.horaHasta) >= finEnMins
        );
    }

    tieneConflictoConTurnos(hora, duracion, turnosDeLaFecha) {
        return turnosDeLaFecha.some(turno => turno.seSuperponeConSlot(hora, duracion));
    }

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

    // --- Gestión de sedes ------------------------------------------------------

    // Retorna false si la sede ya estaba asignada.
    agregarSede(sede) {
        if (this.sedes.some((s) => s.id === sede.id)) return false;
        this.sedes.push(sede);
        return true;
    }

    // Retorna false si la sede no estaba asignada.
    eliminarSede(sedeId) {
        const index = this.sedes.findIndex((s) => s.id === sedeId);
        if (index === -1) return false;
        this.sedes.splice(index, 1);
        return true;
    }

    // --- Gestión de servicios: Especialidades ----------------------------------

    // Retorna null si ya existe una especialidad con el mismo código.
    agregarEspecialidad({ codigo, nombre, duracionTurnoEnMins, costo }) {
        if (this.especialidades.some(e => e.codigo === codigo.trim().toUpperCase()))
            return null;
        const nueva = new Especialidad(codigo, nombre, duracionTurnoEnMins, costo);
        nueva.id = this.especialidades.reduce((max, e) => Math.max(max, e.id || 0), 0) + 1;
        this.especialidades.push(nueva);
        return nueva;
    }

    // Retorna la especialidad modificada, o null si no existe.
    modificarEspecialidad(id, { nombre, duracionTurnoEnMins, costo }) {
        const esp = this.especialidades.find(e => e.id === id);
        if (!esp) return null;
        esp.nombre = nombre.trim();
        esp.duracionTurnoEnMins = duracionTurnoEnMins;
        esp.costo = costo;
        return esp;
    }

    // Retorna true si se eliminó, false si no existía.
    eliminarEspecialidad(id) {
        const index = this.especialidades.findIndex(e => e.id === id);
        if (index === -1) return false;
        this.especialidades.splice(index, 1);
        return true;
    }

    // --- Gestión de servicios: Prácticas ---------------------------------------

    // Retorna null si ya existe una práctica con el mismo código.
    agregarPractica({ codigo, nombre, duracionTurnoEnMins, costo }) {
        if (this.practicas.some(p => p.codigo === codigo.trim().toUpperCase()))
            return null;
        const nueva = new Practica(codigo, nombre, duracionTurnoEnMins, costo);
        nueva.id = this.practicas.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
        this.practicas.push(nueva);
        return nueva;
    }

    // Retorna la práctica modificada, o null si no existe.
    modificarPractica(id, { nombre, duracionTurnoEnMins, costo }) {
        const prac = this.practicas.find(p => p.id === id);
        if (!prac) return null;
        prac.nombre = nombre.trim();
        prac.duracionTurnoEnMins = duracionTurnoEnMins;
        prac.costo = costo;
        return prac;
    }

    // Retorna true si se eliminó, false si no existía.
    eliminarPractica(id) {
        const index = this.practicas.findIndex(p => p.id === id);
        if (index === -1) return false;
        this.practicas.splice(index, 1);
        return true;
    }

    obtenerEspecialidad(valor) {
        return this.especialidades.find(
            e => e.nombre.toLowerCase() === valor.toLowerCase() || e.codigo === valor.toUpperCase()
        ) ?? null;
    }

    obtenerPractica(valor) {
        return this.practicas.find(
            p => p.nombre.toLowerCase() === valor.toLowerCase() || p.codigo === valor.toUpperCase()
        ) ?? null;
    }

    obtenerSedesConFiltro(nombre) {
        if (!nombre) return this.sedes;
        return this.sedes.filter(s => s.nombre.toLowerCase() === nombre.toLowerCase());
    }

    tieneEspecialidad(valor) {
        return this.obtenerEspecialidad(valor) !== null;
    }

    tienePractica(valor) {
        return this.obtenerPractica(valor) !== null;
    }

    tieneSede(nombre) {
        return this.obtenerSedesConFiltro(nombre).length > 0;
    }

    calcularDuracionSlot(filtros) {
        if (filtros.especialidad)
            return this.obtenerEspecialidad(filtros.especialidad)?.duracionTurnoEnMins ?? 30;

        if (filtros.practica)
            return this.obtenerPractica(filtros.practica)?.duracionTurnoEnMins ?? 30;

        const todas = [
            ...this.especialidades.map(e => e.duracionTurnoEnMins),
            ...this.practicas.map(p => p.duracionTurnoEnMins),
        ].filter(Boolean);

        return todas.length ? Math.max(...todas) : 30;
    }

    toJSON() {
        return {
            medico_id:        this.id,
            usuario:          this.usuario,
            matricula:        this.matricula,
            nombre:           this.nombre,
            especialidades:   this.especialidades,
            practicas:        this.practicas,
            sedes:            this.sedes,
            disponibilidades: this.disponibilidades,
        };
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
                disponibilidad_id: d.id,
                horaDesde:         d.horaDesde,
                horaHasta:         d.horaHasta,
                turnosReservados:  d.turnosDeFecha(turnos),
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
