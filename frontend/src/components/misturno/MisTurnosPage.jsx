'use client';

import { useState, useEffect } from 'react';
import Link                    from 'next/link';
import { useRouter }           from 'next/navigation';
import { usePaciente }         from '@/context/PacienteContext';
import { getTurnosPaciente, getMedico } from '@/lib/api';
import TarjetaMiTurno          from '@/components/misturno/TarjetaMiTurno';
import { SkeletonDia }         from '@/components/ui/Skeleton';

const FILTROS = [
  { key: 'todos',     label: 'Todos' },
  { key: 'proximos',  label: 'Próximos' },
  { key: 'realizado', label: 'Realizados' },
  { key: 'cancelado', label: 'Cancelados' },
];

const inferirServicio = (snapshot, duracion) => {
  if (snapshot) {
    const todas = [
      ...(snapshot.especialidades ?? []).map((e) => ({ nombre: e.nombre, tipo: 'especialidad', duracionTurnoEnMins: e.duracionTurnoEnMins })),
      ...(snapshot.practicas      ?? []).map((p) => ({ nombre: p.nombre, tipo: 'práctica',     duracionTurnoEnMins: p.duracionTurnoEnMins })),
    ];
    const match = todas.find((s) => s.duracionTurnoEnMins === duracion);
    if (match) return match;
  }
  return { nombre: 'Turno médico', tipo: 'consulta', duracionTurnoEnMins: duracion };
};

const mapTurno = (t) => ({
  id:                  t.turno_id,
  fecha:               t.fecha,
  hora:                t.hora,
  estado:              t.estado,
  propuestaMedicoFecha: t.propuestaMedicoFecha ?? null,
  medico: {
    nombre:    t.snapshotMedico?.nombre    ?? 'Médico',
    matricula: t.snapshotMedico?.matricula ?? '-',
  },
  servicio:    inferirServicio(t.snapshotMedico, t.duracion),
  sede:        null,
  cobertura:   null,
  montoAbonar: null,
});

export default function MisTurnosPage() {
  const { paciente }              = usePaciente();
  const router                    = useRouter();
  const [filtro, setFiltro]       = useState('todos');
  const [turnos, setTurnos]       = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (paciente === null) { router.replace('/login'); return; }

    getTurnosPaciente(paciente.paciente_id)
      .then((turnos) => {
        const sinSnapshot = turnos.filter((t) => !t.snapshotMedico);
        const idsUnicos   = [...new Set(sinSnapshot.map((t) => t.medico_id))];

        return Promise.all(idsUnicos.map((id) => getMedico(id)))
          .then((medicos) => {
            const medicosPorId = Object.fromEntries(
              medicos.map((m) => [m.medico_id, m])
            );
            return turnos.map((t) => {
              if (!t.snapshotMedico && medicosPorId[t.medico_id]) {
                const m = medicosPorId[t.medico_id];
                return mapTurno({ ...t, snapshotMedico: {
                  nombre:         m.nombre,
                  matricula:      m.matricula,
                  especialidades: m.especialidades ?? [],
                  practicas:      m.practicas      ?? [],
                }});
              }
              return mapTurno(t);
            });
          });
      })
      .then(setTurnos)
      .catch(() => setError('No pudimos cargar tus turnos. Intentá de nuevo.'))
      .finally(() => setCargando(false));
  }, [paciente, router]);

  if (!paciente) return null;

  const turnosFiltrados = turnos.filter((t) => {
    if (filtro === 'todos')    return true;
    if (filtro === 'proximos') return ['reservado', 'pendiente_cambio', 'propuesta_medico'].includes(t.estado);
    return t.estado === filtro;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mis turnos</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Hola <strong>{paciente.nombre}</strong>, acá encontrás todos tus turnos.
        </p>
      </header>

      <div className="flex gap-2 mb-6 flex-wrap" role="tablist" aria-label="Filtrar turnos">
        {FILTROS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={filtro === key}
            onClick={() => setFiltro(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none ${
              filtro === key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {cargando && <SkeletonDia />}

      {error && !cargando && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center text-sm">
          {error}
        </div>
      )}

      {!cargando && !error && turnosFiltrados.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4" aria-hidden="true">📋</p>
          <h2 className="text-lg font-semibold text-gray-700">
            {turnos.length === 0 ? 'No tenés turnos registrados' : 'No hay turnos en esta categoría'}
          </h2>
          <p className="text-gray-500 mt-2 mb-6 text-sm">
            {filtro === 'proximos' || turnos.length === 0
              ? '¿Querés buscar un turno disponible?'
              : 'Probá con otro filtro.'}
          </p>
          {(filtro === 'proximos' || turnos.length === 0) && (
            <Link href="/buscar" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              Buscar turnos
            </Link>
          )}
        </div>
      )}

      {!cargando && !error && turnosFiltrados.length > 0 && (
        <div className="space-y-3" role="list">
          {turnosFiltrados.map((turno) => (
            <div key={turno.id} role="listitem">
              <TarjetaMiTurno
                turno={turno}
                pacienteId={paciente.paciente_id}
                onActualizar={(turnoActualizado) =>
                  setTurnos((prev) => prev.map((t) =>
                    t.id === turnoActualizado.turno_id ? mapTurno(turnoActualizado) : t
                  ))
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
