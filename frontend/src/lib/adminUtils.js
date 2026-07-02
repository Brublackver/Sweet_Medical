export const espValida = (f) =>
  f.codigo.trim() && f.nombre.trim() &&
  parseInt(f.duracionTurnoEnMins, 10) > 0 &&
  !isNaN(parseFloat(f.costo)) && parseFloat(f.costo) >= 0;

export const cobValida = (f) =>
  f.codigo.trim() && f.nivel !== '' &&
  parseInt(f.nivel, 10) >= 0 && parseInt(f.nivel, 10) <= 100;
