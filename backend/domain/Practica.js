export class Practica {
    static nextId = 1;

    constructor(codigo, nombre, duracionTurnoEnMins, costo) {
        this.id = Practica.nextId++;
        this.codigo = codigo.trim().toUpperCase();
        this.nombre = nombre.trim();
        this.duracionTurnoEnMins = duracionTurnoEnMins;
        this.costo = costo;
    }
}
