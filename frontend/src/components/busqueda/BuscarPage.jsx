'use client';

import { useState, useEffect } from 'react';
import { useRouter }    from 'next/navigation';
import { usePaciente }  from '@/context/PacienteContext';
import { buscarTurnos } from '@/lib/api';
import FiltrosBusqueda  from '@/components/busqueda/FiltrosBusqueda';
import ResultadosDia    from '@/components/busqueda/ResultadosDia';
import { SkeletonDia }  from '@/components/ui/Skeleton';

export default function BuscarPage() {
  const { paciente }                    = usePaciente();
  const router                          = useRouter();
  const [resultados, setResultados]     = useState(null);
  const [cargando,   setCargando]       = useState(false);
  const [error,      setError]          = useState('');

  useEffect(() => {
    if (paciente === null) router.replace('/login');
  }, [paciente, router]);

  if (!paciente) return null;

  const handleBuscar = (filtros) => {
    setError('');
    setCargando(true);
    setResultados(null);
    buscarTurnos({ ...filtros, pacienteId: paciente.paciente_id })
      .then(setResultados)
      .catch(() => setError('No pudimos conectar con el servidor. Verificá que el backend esté corriendo.'))
      .finally(() => setCargando(false));
  };

  const totalTurnos = resultados?.reduce((acc, d) => acc + d.turnos.length, 0) ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Buscar turno</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Encontrá turnos disponibles y agregálos a tu preselección.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        <aside aria-label="Panel de filtros">
          <FiltrosBusqueda onBuscar={handleBuscar} cargando={cargando} />
        </aside>

        <section aria-label="Resultados de búsqueda" aria-live="polite" className="min-h-[400px]">
          {cargando && (
            <div className="space-y-8">
              <SkeletonDia />
              <SkeletonDia />
            </div>
          )}

          {error && !cargando && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
              <p className="text-2xl mb-2" aria-hidden="true">⚠️</p>
              <p className="font-semibold">Error al buscar</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {!cargando && !error && resultados?.length === 0 && (
            <div className="text-center py-20">
              <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
              <h2 className="text-lg font-semibold text-gray-700">Sin resultados</h2>
              <p className="text-gray-500 mt-2 text-sm">
                No hay turnos disponibles para los filtros seleccionados.<br />
                Probá con otras fechas, especialidad o sede.
              </p>
            </div>
          )}

          {!cargando && !error && resultados?.length > 0 && (
            <div className="space-y-8">
              <p className="text-sm text-gray-500">
                <strong className="text-gray-900">{totalTurnos}</strong>{' '}
                {totalTurnos === 1 ? 'turno disponible' : 'turnos disponibles'}
              </p>
              {resultados.map((dia) => (
                <ResultadosDia key={dia.fecha} dia={dia} />
              ))}
            </div>
          )}

          {!cargando && !error && resultados === null && (
            <div className="text-center py-20">
              <p className="text-5xl mb-4" aria-hidden="true">🩺</p>
              <h2 className="text-lg font-semibold text-gray-700">Buscá tu turno</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Usá los filtros para encontrar el turno que necesitás.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
