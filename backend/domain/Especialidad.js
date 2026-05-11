export class Especialidad {
    constructor(codigo, nombre, duracionTurnoEnMins, costo) {
        this.id = null;
        this.codigo = codigo.trim().toUpperCase();
        this.nombre = nombre.trim();
        this.duracionTurnoEnMins = duracionTurnoEnMins;
        this.costo = costo;
    }

    toJSON() {
        return {
            especialidad_id:     this.id,
            codigo:              this.codigo,
            nombre:              this.nombre,
            duracionTurnoEnMins: this.duracionTurnoEnMins,
            costo:               this.costo,
        };
    }
}
