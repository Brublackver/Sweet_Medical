// Zona horaria de la aplicación. Argentina NO observa horario de verano desde
// 2009, por lo que su offset es fijo UTC-03:00. Usar un offset explícito hace que
// toda comparación de fecha/hora sea independiente de la zona horaria del proceso
// (en Railway el server corre en UTC; en desarrollo local suele ser ART).
export const TZ_ARG     = "America/Argentina/Buenos_Aires";
export const OFFSET_ARG = "-03:00";

// Convierte "HH:MM" a minutos desde medianoche.
// Usado por Medico y Turno para comparar intervalos de tiempo como números enteros.
export const horaAMinutos = (hora) => {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
};

// Construye el instante ABSOLUTO (Date) de un turno a partir de su fecha ("YYYY-MM-DD")
// y su hora ("HH:MM"), interpretándolas SIEMPRE en hora de Argentina.
//
// Clave: sin el offset explícito, `new Date("2026-07-01T14:00:00")` se parsea en la
// zona horaria local del proceso. En Railway (UTC) eso corre el turno 3 horas y lo
// hace parecer "pasado" aunque falten un par de horas. Con `-03:00` el instante es
// correcto sin importar dónde corra el servidor.
export const buildAppointmentDateTime = (fecha, hora) =>
    new Date(`${fecha}T${hora}:00${OFFSET_ARG}`);

// true si el turno ya venció: su instante es <= ahora (o la fecha/hora es inválida).
export const isAppointmentExpired = (fecha, hora, ahora = new Date()) => {
    const inicio = buildAppointmentDateTime(fecha, hora);
    return Number.isNaN(inicio.getTime()) || inicio <= ahora;
};

// true si el turno todavía puede reservarse: su instante es estrictamente futuro.
export const isAppointmentBookable = (fecha, hora, ahora = new Date()) =>
    !isAppointmentExpired(fecha, hora, ahora);

// Fecha de hoy en formato ISO "YYYY-MM-DD" en hora de Argentina.
// Se calcula vía Intl con timeZone explícita para no desfasar el día por la zona
// horaria del proceso (un server en UTC podría devolver el día siguiente después
// de las 21:00 ART). El locale "en-CA" produce el formato YYYY-MM-DD.
export const fechaHoyISO = () =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ_ARG }).format(new Date());
