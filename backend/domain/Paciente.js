export class Paciente {
    constructor(id, usuario, dni, nombre, obraSocial, plan) {
        this.id = id;
        this.usuario = usuario;
        this.dni = dni;
        this.nombre = nombre;
        this.obraSocial = obraSocial;
        this.plan = plan;
    }

    toJSON() {
        return {
            paciente_id: this.id,
            usuario:     this.usuario,
            dni:         this.dni,
            nombre:      this.nombre,
            obraSocial:  this.obraSocial,
            plan:        this.plan,
        };
    }
}
