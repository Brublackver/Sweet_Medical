/*
    DOMAIN — Entidad Turno
    Representa un turno medico reservado por un paciente.
    Contiene los datos del turno y su estado actual.
*/

export class Turno {
    constructor(id, medicoId, pacienteId, fechaHora) {
        this.id = id;
        this.medicoId = medicoId;
        this.pacienteId = pacienteId;
        this.fechaHora = fechaHora;
        this.estado = "reservado";
        this.fechaCreacion = new Date().toISOString();
    }
}
