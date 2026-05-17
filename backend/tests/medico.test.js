import { describe, it, expect } from "@jest/globals";
import { Medico }                from "../domain/Medico.js";

const crearMedico = () => new Medico(1, "drhouse", "12345", "Gregory House");

describe("Medico - Disponibilidad", () => {

    it("tieneDisponibilidad() retorna true cuando el turno cabe entero en la ventana", () => {
        const medico = crearMedico();
        medico.definirDisponibilidad({ fecha: "2030-01-15", horaDesde: "09:00", horaHasta: "17:00" });
        expect(medico.tieneDisponibilidad("2030-01-15", "10:00", 60)).toBe(true);
    });
});

describe("Medico - Especialidades", () => {

    it("agregarEspecialidad() retorna null y no agrega si el código ya existe", () => {
        const medico = crearMedico();
        medico.agregarEspecialidad({ codigo: "CAR", nombre: "Cardiología", duracionTurnoEnMins: 30, costo: 100 });
        const resultado = medico.agregarEspecialidad({ codigo: "CAR", nombre: "Cardiología Avanzada", duracionTurnoEnMins: 45, costo: 150 });
        expect(resultado).toBeNull();
        expect(medico.especialidades).toHaveLength(1);
    });
});
