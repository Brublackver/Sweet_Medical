const estilos = {
  reservado:        'bg-blue-100   text-blue-700   border-blue-200',
  realizado:        'bg-green-100  text-green-700  border-green-200',
  cancelado:        'bg-red-100    text-red-600    border-red-200',
  pendiente_cambio: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  propuesta_medico: 'bg-orange-100 text-orange-700 border-orange-200',
};

const etiquetas = {
  reservado:        '● Reservado',
  realizado:        '✓ Realizado',
  cancelado:        '✕ Cancelado',
  pendiente_cambio: '⟳ Cambio pendiente',
  propuesta_medico: '⟳ Propuesta médico',
};

export function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${estilos[estado] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {etiquetas[estado] ?? estado}
    </span>
  );
}
