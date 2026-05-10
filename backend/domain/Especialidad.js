export class Especialidad {
    constructor(codigo, nombre, duracionTurnoEnMins, costo) {
        this.id = null; // asignado por MongoDB al persistir
        this.codigo = codigo.trim().toUpperCase();
        this.nombre = nombre.trim();
        this.duracionTurnoEnMins = duracionTurnoEnMins;
        this.costo = costo;
    }
}
