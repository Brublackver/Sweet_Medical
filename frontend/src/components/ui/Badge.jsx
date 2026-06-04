const estilos = {
  COMPLETA:    'bg-green-100  text-green-700  border-green-200',
  PARCIAL:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  NO_CUBIERTA: 'bg-red-100    text-red-600    border-red-200',
};

const etiquetas = {
  COMPLETA:    '✓ Cobertura total',
  PARCIAL:     '◑ Cobertura parcial',
  NO_CUBIERTA: '✕ Sin cobertura',
};

export function CoberturasBadge({ cobertura }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${estilos[cobertura] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {etiquetas[cobertura] ?? cobertura}
    </span>
  );
}
