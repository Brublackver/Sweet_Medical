import { Sede } from "../domain/Sede.js";

export class SedeRepository {
    constructor() {
        this.sedes  = [
            new Sede(1, "Medrano", "Av. Medrano 123"),
            new Sede(2, "Campus",  "Campus Universitario s/n"),
        ];
        this.nextId = 3;
    }

    obtenerTodos() {
        return Promise.resolve(this.sedes);
    }

    obtenerPorId(id) {
        return Promise.resolve(this.sedes.find((s) => s.id === id) || null);
    }

    existeNombre(nombre) {
        return Promise.resolve(
            this.sedes.some((s) => s.nombre.toLowerCase() === nombre.trim().toLowerCase())
        );
    }

    crear(datos) {
        const nueva = new Sede(this.nextId++, datos.nombre.trim(), datos.direccion.trim());
        this.sedes.push(nueva);
        return Promise.resolve(nueva);
    }
}
