// Convierte "HH:MM" a minutos desde medianoche.
// Usado por Medico y Turno para comparar intervalos de tiempo como números enteros.
export const horaAMinutos = (hora) => {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
};
