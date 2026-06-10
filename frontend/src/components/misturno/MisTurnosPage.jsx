import { useState, useEffect } from 'react';
import { Link, useNavigate }   from 'react-router-dom';
import { usePaciente }         from '@/context/PacienteContext';
import { getTurnosPaciente, getMedico } from '@/lib/api';
import { filtrarTurnos }       from '@/lib/turnos';
import TarjetaMiTurno          from '@/components/misturno/TarjetaMiTurno';
import { SkeletonDia }         from '@/components/ui/Skeleton';
import styles from './MisTurnos.module.css';

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
  const { paciente, logout }      = usePaciente();
  const navigate                  = useNavigate();
  const [filtro, setFiltro]       = useState('todos');
  const [turnos, setTurnos]       = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (paciente === null) { navigate('/login', { replace: true }); return; }

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
      .catch((err) => {
        if (err.response?.status === 404) {
          logout();
          navigate('/login', { replace: true });
        } else {
          setError('No pudimos cargar tus turnos. Intentá de nuevo.');
        }
      })
      .finally(() => setCargando(false));
  }, [paciente, navigate, logout]);

  if (!paciente) return null;

  const turnosFiltrados = filtrarTurnos(turnos, filtro);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Mis turnos</h1>
        <p className={styles.pageSubtitle}>
          Hola <strong>{paciente.nombre}</strong>, acá encontrás todos tus turnos.
        </p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Filtrar turnos">
        {FILTROS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={filtro === key}
            onClick={() => setFiltro(key)}
            className={`${styles.tab} ${filtro === key ? styles.tabActivo : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {cargando && <SkeletonDia />}

      {error && !cargando && (
        <div role="alert" className={styles.alerta}>{error}</div>
      )}

      {!cargando && !error && turnosFiltrados.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon} aria-hidden="true">📋</p>
          <h2 className={styles.emptyTitle}>
            {turnos.length === 0 ? 'No tenés turnos registrados' : 'No hay turnos en esta categoría'}
          </h2>
          <p className={styles.emptyText}>
            {filtro === 'proximos' || turnos.length === 0
              ? '¿Querés buscar un turno disponible?'
              : 'Probá con otro filtro.'}
          </p>
          {(filtro === 'proximos' || turnos.length === 0) && (
            <Link to="/buscar" className={styles.buscarLink}>
              🔍 Buscar turnos
            </Link>
          )}
        </div>
      )}

      {!cargando && !error && turnosFiltrados.length > 0 && (
        <div className={styles.lista} role="list">
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
