/*
    DOMAIN — Paciente

    Además del paciente real, el sistema admite pacientes DEMO: cuentas
    temporales que se crean sin registro para que cualquiera pueda probar la app.

    Un paciente demo es un paciente común en todo lo demás — reserva turnos,
    cancela, se anota en la fila de espera. La única diferencia es que tiene
    fecha de vencimiento y que el sistema lo borra (junto con sus turnos) cuando
    expira, para no dejar basura ni ocupar agenda para siempre.
*/
export class Paciente {
    constructor(id, usuario, dni, nombre, obraSocial, plan, esDemo = false, expiraEn = null) {
        this.id = id;
        this.usuario = usuario;
        this.dni = dni;
        this.nombre = nombre;
        this.obraSocial = obraSocial;
        this.plan = plan;
        this.esDemo = esDemo;
        this.expiraEn = expiraEn;
    }

    // true si es una cuenta demo cuyo plazo ya venció.
    estaExpirado(ahora = new Date()) {
        if (!this.esDemo || !this.expiraEn) return false;
        return new Date(this.expiraEn) <= ahora;
    }

    // Minutos que le quedan de vida. 0 si ya expiró, null si no es demo.
    // Lo usa la UI para avisarle al invitado cuánto le queda.
    minutosRestantes(ahora = new Date()) {
        if (!this.esDemo || !this.expiraEn) return null;
        const restante = new Date(this.expiraEn) - ahora;
        return restante <= 0 ? 0 : Math.ceil(restante / 60000);
    }

    toJSON() {
        return {
            paciente_id: this.id,
            usuario:     this.usuario,
            dni:         this.dni,
            nombre:      this.nombre,
            obraSocial:  this.obraSocial,
            plan:        this.plan,
            es_demo:     this.esDemo === true,
            expira_en:   this.expiraEn ?? null,
            minutos_restantes: this.minutosRestantes(),
        };
    }
}
