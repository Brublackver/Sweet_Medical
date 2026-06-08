'use client';

import { useState, useEffect } from 'react';
import Link            from 'next/link';
import { useRouter }   from 'next/navigation';
import { usePaciente } from '@/context/PacienteContext';
import { useCarrito }  from '@/context/CarritoContext';
import { CoberturasBadge }  from '@/components/ui/Badge';
import { formatearFecha }   from '@/lib/fecha';

export default function ConfirmacionPage() {
  const { paciente }              = usePaciente();
  const { items, vaciar }         = useCarrito();
  const router                    = useRouter();
  const [confirmado, setConfirmado] = useState(false);
  const [cargando, setCargando]     = useState(false);
  const [turnosConfirmados, setTurnosConfirmados] = useState([]);

  useEffect(() => {
    if (paciente === null) { router.replace('/login'); return; }
    if (!confirmado && items.length === 0) router.replace('/solicitudes');
  }, [paciente, items, confirmado, router]);

  if (!paciente) return null;

  const total = items.reduce((sum, item) => sum + (item.montoAbonar ?? 0), 0);

  const handleConfirmar = () => {
    setCargando(true);
    setTurnosConfirmados([...items]);
    setTimeout(() => {
      vaciar();
      setCargando(false);
      setConfirmado(true);
    }, 1200);
  };

  if (confirmado) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white rounded-2xl border border-green-200 p-10 shadow-sm">
          <div className="text-6xl mb-4" aria-hidden="true">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h1>
          <p className="text-gray-500 text-sm mb-8">
            Tu solicitud de {turnosConfirmados.length} {turnosConfirmados.length === 1 ? 'turno fue registrada' : 'turnos fue registrada'} correctamente.
            Te avisaremos cuando sea confirmada.
          </p>

          <div className="space-y-3 text-left mb-8">
            {turnosConfirmados.map((item) => (
              <div key={item.key} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <span className="text-green-500 text-lg" aria-hidden="true">✓</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{item.servicio.nombre}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {formatearFecha(item.fecha)} — {item.hora} hs · Dr/a. {item.medico.nombre}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mis-turnos"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Ver mis turnos
            </Link>
            <Link
              href="/buscar"
              className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Buscar más turnos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Confirmar solicitud</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Revisá los turnos antes de confirmar.
        </p>
      </header>

      <div className="space-y-3 mb-8">
        {items.map((item) => (
          <article
            key={item.key}
            aria-label={`Turno: ${item.servicio.nombre}`}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4"
          >
            <div className="text-center shrink-0 w-16">
              <p className="text-lg font-bold text-gray-900">{item.hora}</p>
              <p className="text-xs text-gray-400">hs</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900 text-sm">{item.servicio.nombre}</p>
                <CoberturasBadge cobertura={item.cobertura} />
              </div>
              <p className="text-xs text-gray-500 capitalize mb-0.5">{formatearFecha(item.fecha)}</p>
              <p className="text-xs text-gray-500">Dr/a. {item.medico.nombre} · {item.sedes?.[0]?.nombre}</p>
            </div>
            <div className="text-right shrink-0">
              {item.montoAbonar === 0
                ? <p className="text-green-600 font-bold text-sm">Sin costo</p>
                : <p className="text-gray-900 font-bold text-sm">${item.montoAbonar.toLocaleString('es-AR')}</p>
              }
            </div>
          </article>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total estimado</p>
            <p className="text-2xl font-bold text-gray-900">${total.toLocaleString('es-AR')}</p>
          </div>
          <p className="text-xs text-gray-400 max-w-[160px] text-right">
            Sujeto a confirmación según disponibilidad.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleConfirmar}
          disabled={cargando}
          className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none"
        >
          {cargando ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando solicitud...
            </span>
          ) : 'Confirmar solicitud'}
        </button>
        <Link
          href="/solicitudes"
          className="flex-1 py-3 text-center border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Volver a mis solicitudes
        </Link>
      </div>
    </div>
  );
}
