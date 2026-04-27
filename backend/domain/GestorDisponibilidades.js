export class GestorDisponibilidades {

    static separarPorDia(disponibilidades, dia) {
        return {
            mismosDia: disponibilidades.filter(d => d.diaSemana === dia),
            otrosDias: disponibilidades.filter(d => d.diaSemana !== dia),
        };
    }

    static integrarEnDia(nueva, mismosDia) {
        let bloque = nueva;

        const sinSolapamiento = mismosDia.filter(disp => {
            if (bloque.seSolapaCon(disp)) {
                bloque = bloque.fusionarCon(disp);
                return false;
            }
            return true;
        });

        return [...sinSolapamiento, bloque];
    }

    static definir(disponibilidades, nueva) {
        const { mismosDia, otrosDias } = this.separarPorDia(disponibilidades, nueva.diaSemana);
        const diaActualizado = this.integrarEnDia(nueva, mismosDia);

        return [...otrosDias, ...diaActualizado];
    }
}
