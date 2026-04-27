export class DisponibilidadHoraria {
    constructor(diaSemana, horaDesde, horaHasta) {
        this.diaSemana = diaSemana;
        this.horaDesde = horaDesde;
        this.horaHasta = horaHasta;
    }

    static diaDeFecha(fecha, hora) {
        const diasSemana = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
        const dt = new Date(`${fecha}T${hora}:00`);
        return diasSemana[dt.getDay()];
    }

    turnosDelDia(turnos) {
        return turnos
            .filter(t => DisponibilidadHoraria.diaDeFecha(t.fecha, t.hora) === this.diaSemana)
            .map(t => ({ hora: t.hora }));
    }

    seSolapaCon(otra) {
        return this.horaDesde < otra.horaHasta && this.horaHasta > otra.horaDesde;
    }

    fusionarCon(otra) {
        return new DisponibilidadHoraria(
            this.diaSemana,
            Math.min(this.horaDesde, otra.horaDesde),
            Math.max(this.horaHasta, otra.horaHasta)
        );
    }
}
