'use client';

import { useCarrito }       from '@/context/CarritoContext';
import { CoberturasBadge }  from '@/components/ui/Badge';

export default function TarjetaTurno({ turno, fecha }) {
  const { agregar, quitarTurno, estaAgregado } = useCarrito();
  const item      = { ...turno, fecha };
  const enCarrito = estaAgregado(item);

  const handleToggle = () => enCarrito ? quitarTurno(item) : agregar(item);

  return (
    <article
      aria-label={`Turno: ${turno.servicio.nombre} el ${fecha} a las ${turno.hora}`}
      className={`bg-white rounded-xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
        enCarrito ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-900 text-lg leading-none">{turno.hora} hs</p>
          <p className="text-xs text-gray-400 mt-1">{turno.servicio.duracionTurnoEnMins} min</p>
        </div>
        <CoberturasBadge cobertura={turno.cobertura} />
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-800">{turno.servicio.nombre}</p>
        <p className="text-xs text-gray-400 capitalize mt-0.5">{turno.servicio.tipo}</p>
      </div>

      <div>
        <p className="text-sm text-gray-700">Dr/a. {turno.medico.nombre}</p>
        <p className="text-xs text-gray-400">Matr. {turno.medico.matricula}</p>
      </div>

      {turno.sedes?.length > 0 && (
        <p className="text-xs text-gray-500">
          📍 {turno.sedes[0].nombre}
          {turno.sedes[0].direccion && (
            <span className="text-gray-400"> — {turno.sedes[0].direccion}</span>
          )}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
        <div>
          {turno.montoAbonar === 0 ? (
            <span className="text-green-600 font-bold text-sm">Sin costo</span>
          ) : (
            <>
              <span className="text-gray-900 font-bold text-sm">
                ${turno.montoAbonar.toLocaleString('es-AR')}
              </span>
              {turno.cobertura === 'PARCIAL' && (
                <p className="text-xs text-gray-400 line-through">
                  ${turno.servicio.costo.toLocaleString('es-AR')}
                </p>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleToggle}
          aria-pressed={enCarrito}
          aria-label={enCarrito ? `Quitar ${turno.servicio.nombre} de mis solicitudes` : `Agregar ${turno.servicio.nombre} a mis solicitudes`}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none ${
            enCarrito
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          {enCarrito ? '✓ Solicitado' : '+ Solicitar'}
        </button>
      </div>
    </article>
  );
}
