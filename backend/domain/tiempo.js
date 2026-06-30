// Convierte "HH:MM" a minutos desde medianoche.
// Usado por Medico y Turno para comparar intervalos de tiempo como números enteros.
export const horaAMinutos = (hora) => {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
};

// Fecha de hoy en formato ISO "YYYY-MM-DD" usando la zona horaria local.
// Se construye campo a campo (no vía toISOString) para no desfasar el día
// por la conversión a UTC en zonas con offset negativo (ej. Argentina UTC-3).
export const fechaHoyISO = () => {
    const ahora = new Date();
    const yyyy  = ahora.getFullYear();
    const mm    = String(ahora.getMonth() + 1).padStart(2, "0");
    const dd    = String(ahora.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};
