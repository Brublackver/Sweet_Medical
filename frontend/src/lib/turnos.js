const ESTADOS_PROXIMOS = ['reservado', 'pendiente_cambio', 'propuesta_medico'];

export const filtrarTurnos = (turnos, filtro) => {
  if (filtro === 'todos')    return turnos;
  if (filtro === 'proximos') return turnos.filter((t) => ESTADOS_PROXIMOS.includes(t.estado));
  return turnos.filter((t) => t.estado === filtro);
};
