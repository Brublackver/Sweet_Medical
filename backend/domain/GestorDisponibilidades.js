export class GestorDisponibilidades {

    static separarPorFecha(disponibilidades, fecha) {
        return {
            mismaFecha: disponibilidades.filter(d => d.fecha === fecha),
            otrasFechas: disponibilidades.filter(d => d.fecha !== fecha),
        };
    }

    static integrarEnFecha(nueva, mismaFecha) {
        let bloque = nueva;

        const sinSolapamiento = mismaFecha.filter(disp => {
            if (bloque.seSolapaCon(disp)) {
                bloque = bloque.fusionarCon(disp);
                return false;
            }
            return true;
        });

        return [...sinSolapamiento, bloque];
    }

    static definir(disponibilidades, nueva) {
        const { mismaFecha, otrasFechas } = this.separarPorFecha(disponibilidades, nueva.fecha);
        const fechaActualizada = this.integrarEnFecha(nueva, mismaFecha);

        return [...otrasFechas, ...fechaActualizada];
    }
}
