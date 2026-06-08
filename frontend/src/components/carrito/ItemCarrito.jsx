import { CoberturasBadge } from '@/components/ui/Badge';
import { formatearFecha }  from '@/lib/fecha';

export default function ItemCarrito({ item, onQuitar }) {
  return (
    <article
      aria-label={`Turno: ${item.servicio.nombre}`}
      className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <p className="font-semibold text-gray-900">{item.servicio.nombre}</p>
          <CoberturasBadge cobertura={item.cobertura} />
        </div>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>
            📅 <span className="capitalize">{formatearFecha(item.fecha)}</span> a las{' '}
            <strong>{item.hora} hs</strong>
            <span className="text-gray-400"> ({item.servicio.duracionTurnoEnMins} min)</span>
          </li>
          <li>
            👨‍⚕️ Dr/a. {item.medico.nombre}{' '}
            <span className="text-gray-400">(Mat. {item.medico.matricula})</span>
          </li>
          {item.sedes?.[0] && <li>📍 {item.sedes[0].nombre}</li>}
        </ul>
      </div>

      <div className="text-right shrink-0">
        {item.montoAbonar === 0 ? (
          <p className="text-green-600 font-bold">Sin costo</p>
        ) : (
          <>
            <p className="text-gray-900 font-bold">${item.montoAbonar.toLocaleString('es-AR')}</p>
            {item.cobertura === 'PARCIAL' && (
              <p className="text-xs text-gray-400 line-through">
                ${item.servicio.costo.toLocaleString('es-AR')}
              </p>
            )}
          </>
        )}
        <button
          onClick={onQuitar}
          aria-label={`Quitar ${item.servicio.nombre} del carrito`}
          className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors underline"
        >
          Quitar
        </button>
      </div>
    </article>
  );
}
