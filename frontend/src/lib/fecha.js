// Argentina no observa horario de verano: offset fijo UTC-03:00. Mismo criterio
// que el backend (domain/tiempo.js), para que frontend y backend coincidan al
// decidir si un turno venció.
export const TZ_ARG     = 'America/Argentina/Buenos_Aires';
const OFFSET_ARG        = '-03:00';

const parsearFecha = (fechaStr) => {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};

// Instante absoluto del turno interpretando fecha+hora en hora de Argentina.
export const buildAppointmentDateTime = (fecha, hora) =>
  new Date(`${fecha}T${hora}:00${OFFSET_ARG}`);

// true si el turno todavía puede reservarse (su horario es estrictamente futuro).
// Filtro de seguridad en el cliente: el backend ya no debería devolver vencidos,
// pero si la página quedó abierta y el turno venció, deja de mostrarse al refrescar.
export const esTurnoReservable = (fecha, hora, ahora = new Date()) => {
  const inicio = buildAppointmentDateTime(fecha, hora);
  return !Number.isNaN(inicio.getTime()) && inicio > ahora;
};

// Fecha de hoy "YYYY-MM-DD" en hora de Argentina (locale en-CA → formato ISO).
export const hoyISO = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ_ARG }).format(new Date());

// Fecha dentro de N días "YYYY-MM-DD" en hora de Argentina.
export const enNDiasISO = (n) => {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: TZ_ARG })
    .formatToParts(new Date())
    .reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  const base = new Date(`${partes.year}-${partes.month}-${partes.day}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + n);
  return base.toISOString().split('T')[0];
};

export const formatearFecha = (fechaStr) =>
  parsearFecha(fechaStr).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

export const formatearFechaConAnio = (fechaStr) =>
  parsearFecha(fechaStr).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

export const formatearFechaCorta = (fechaStr) =>
  parsearFecha(fechaStr).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short',
  });
