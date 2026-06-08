const parsearFecha = (fechaStr) => {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
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
