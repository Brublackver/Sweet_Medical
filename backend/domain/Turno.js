/*
    DOMAIN — Entidad Turno
    Representa un turno medico reservado por un paciente.
    Contiene los datos del turno y su estado actual.
*/

export class Turno {
  constructor(id, medicoId, fecha, hora) {
    this.id = id;
    this.medicoId = medicoId;
    this.fecha = fecha;
    this.hora = hora;
    this.estado = "reservado";
    this.fechaCreacion = new Date().toISOString();
  }

  puedeCancelarse() {
    const fechaTurno = new Date(this.fecha + "T" + this.hora + ":00");
    const diferenciaHoras = (fechaTurno - new Date()) / (1000 * 60 * 60);
    return diferenciaHoras >= 1;
  }
}
