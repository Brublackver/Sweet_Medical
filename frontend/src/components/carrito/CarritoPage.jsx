'use client';

import { useEffect }   from 'react';
import Link            from 'next/link';
import { useRouter }   from 'next/navigation';
import { usePaciente } from '@/context/PacienteContext';
import { useCarrito }  from '@/context/CarritoContext';
import ItemCarrito     from '@/components/carrito/ItemCarrito';

export default function CarritoPage() {
  const { paciente }              = usePaciente();
  const { items, quitar, vaciar } = useCarrito();
  const router                    = useRouter();

  useEffect(() => {
    if (paciente === null) router.replace('/login');
  }, [paciente, router]);

  if (!paciente) return null;

  const total = items.reduce((sum, item) => sum + (item.montoAbonar ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis solicitudes</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {items.length === 0
              ? 'No tenés turnos en tu lista de solicitudes todavía.'
              : `${items.length} ${items.length === 1 ? 'turno por solicitar' : 'turnos por solicitar'}`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={vaciar}
            aria-label="Limpiar todas las solicitudes"
            className="text-sm text-red-400 hover:text-red-600 transition-colors mt-1"
          >
            Limpiar lista
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4" aria-hidden="true">🗓️</p>
          <h2 className="text-xl font-semibold text-gray-700">No hay turnos en tu lista</h2>
          <p className="text-gray-500 mt-2 mb-8 text-sm">
            Buscá turnos disponibles y agregálos a tus solicitudes.
          </p>
          <Link
            href="/buscar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            Buscar turnos
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCarrito key={item.key} item={item} onQuitar={() => quitar(item.key)} />
          ))}

          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <p className="text-sm text-gray-500">Total estimado a abonar</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${total.toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  El monto puede variar según tu cobertura al momento de la consulta.
                </p>
              </div>
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Seguir buscando turnos
              </Link>
            </div>
            <Link
              href="/confirmar"
              className="w-full inline-flex items-center justify-center py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              Confirmar solicitud →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
