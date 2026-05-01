export class DisponibilidadHoraria {
    static nextId = 1;

    constructor(fecha, horaDesde, horaHasta) {
        this.id = DisponibilidadHoraria.nextId++;
        this.fecha = fecha;
        this.horaDesde = horaDesde;
        this.horaHasta = horaHasta;
    }

    static #toMinutos(hora) {
        const [h, m] = hora.split(":").map(Number);
        return h * 60 + m;
    }

    static #fromMinutos(minutos) {
        const h = Math.floor(minutos / 60).toString().padStart(2, "0");
        const m = (minutos % 60).toString().padStart(2, "0");
        return `${h}:${m}`;
    }

    turnosDeFecha(turnos) {
        return turnos
            .filter(t => t.fecha === this.fecha)
            .map(t => ({ hora: t.hora }));
    }

    seSolapaCon(otra) {
        return DisponibilidadHoraria.#toMinutos(this.horaDesde) < DisponibilidadHoraria.#toMinutos(otra.horaHasta)
            && DisponibilidadHoraria.#toMinutos(this.horaHasta) > DisponibilidadHoraria.#toMinutos(otra.horaDesde);
    }

    fusionarCon(otra) {
        const desdeMin = Math.min(
            DisponibilidadHoraria.#toMinutos(this.horaDesde),
            DisponibilidadHoraria.#toMinutos(otra.horaDesde)
        );
        const hastaMin = Math.max(
            DisponibilidadHoraria.#toMinutos(this.horaHasta),
            DisponibilidadHoraria.#toMinutos(otra.horaHasta)
        );
        return new DisponibilidadHoraria(
            this.fecha,
            DisponibilidadHoraria.#fromMinutos(desdeMin),
            DisponibilidadHoraria.#fromMinutos(hastaMin)
        );
    }
}
