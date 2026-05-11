export class Sede {
    constructor(id, nombre, direccion) {
        this.id = id;
        this.nombre = nombre;
        this.direccion = direccion;
    }

    toJSON() {
        return {
            sede_id:   this.id,
            nombre:    this.nombre,
            direccion: this.direccion,
        };
    }
}
