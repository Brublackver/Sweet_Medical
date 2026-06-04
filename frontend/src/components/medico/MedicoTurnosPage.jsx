'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { useMedico }           from '@/context/MedicoContext';
import { getTurnosMedico }     from '@/lib/api';
import TarjetaTurnoMedico      from '@/components/medico/TarjetaTurnoMedico';
import { SkeletonDia }         from '@/components/ui/Skeleton';

const FILTROS = [
  { key: 'todos',           label: 'Todos' },
  { key: 'proximos',        label: 'Próximos' },
  { key: 'pendiente_cambio', label: 'Cambios pendientes' },
  { key: 'realizado',       label: 'Realizados' },
  { key: 'cancelado',       label: 'Cancelados' },
];

export default function MedicoTurnosPage() {
  const { medico }               = useMedico();
  const router                   = useRouter();
  const [filtro, setFiltro]      = useState('todos');
  const [turnos, setTurnos]      = useState([]);
  const [cargando, setCargando]  = useState(true);
  const [error, setError]        = useState('');

  const cargarTurnos = () => {
    if (!medico) return;
    setCargando(true);
    getTurnosMedico(medico.medico_id)
      .then(setTurnos)
      .catch(() => setError('No pudimos cargar los turnos. Intentá de nuevo.'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (medico === null) { router.replace('/login'); return; }
    cargarTurnos();
  }, [medico, router]);

  if (!medico) return null;

  const turnosFiltrados = turnos.filter((t) => {
    if (filtro === 'todos')    return true;
    if (filtro === 'proximos') return ['reservado', 'pendiente_cambio', 'propuesta_medico'].includes(t.estado);
    return t.estado === filtro;
  });

  const handleActualizar = (turnoActualizado) =>
    setTurnos((prev) => prev.map((t) =>
      t.turno_id === turnoActualizado.turno_id ? turnoActualizado : t
    ));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mis turnos</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Dr/a. <strong>{medico.nombre}</strong> · Mat. {medico.matricula}
        </p>
      </header>

      <div className="flex gap-2 mb-6 flex-wrap" role="tablist">
        {FILTROS.map(({ key, label }) => (
          <button key={key} role="tab" aria-selected={filtro === key}
            onClick={() => setFiltro(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none ${
              filtro === key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {cargando && <SkeletonDia />}

      {error && !cargando && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center text-sm">{error}</div>
      )}

      {!cargando && !error && turnosFiltrados.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4" aria-hidden="true">📋</p>
          <h2 className="text-lg font-semibold text-gray-700">
            {turnos.length === 0 ? 'No tenés turnos registrados' : 'No hay turnos en esta categoría'}
          </h2>
        </div>
      )}

      {!cargando && !error && turnosFiltrados.length > 0 && (
        <div className="space-y-3">
          {turnosFiltrados.map((turno) => (
            <TarjetaTurnoMedico
              key={turno.turno_id}
              turno={turno}
              medicoId={medico.medico_id}
              onActualizar={handleActualizar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
