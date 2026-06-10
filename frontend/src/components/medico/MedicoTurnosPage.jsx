import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useMedico }           from '@/context/MedicoContext';
import { getTurnosMedico }     from '@/lib/api';
import { filtrarTurnos }       from '@/lib/turnos';
import TarjetaTurnoMedico      from '@/components/medico/TarjetaTurnoMedico';
import { SkeletonDia }         from '@/components/ui/Skeleton';
import styles from './Medico.module.css';

const FILTROS = [
  { key: 'todos',           label: 'Todos' },
  { key: 'proximos',        label: 'Próximos' },
  { key: 'pendiente_cambio', label: 'Cambios pendientes' },
  { key: 'realizado',       label: 'Realizados' },
  { key: 'cancelado',       label: 'Cancelados' },
];

export default function MedicoTurnosPage() {
  const { medico, logout }       = useMedico();
  const navigate                 = useNavigate();
  const [filtro, setFiltro]      = useState('todos');
  const [turnos, setTurnos]      = useState([]);
  const [cargando, setCargando]  = useState(true);
  const [error, setError]        = useState('');

  useEffect(() => {
    if (medico === null) { navigate('/login', { replace: true }); return; }
    getTurnosMedico(medico.medico_id)
      .then(setTurnos)
      .catch((err) => {
        if (err.response?.status === 404) {
          logout();
          navigate('/login', { replace: true });
        } else {
          setError('No pudimos cargar los turnos. Intentá de nuevo.');
        }
      })
      .finally(() => setCargando(false));
  }, [medico, navigate, logout]);

  if (!medico) return null;

  const turnosFiltrados = filtrarTurnos(turnos, filtro);

  const handleActualizar = (turnoActualizado) =>
    setTurnos((prev) => prev.map((t) =>
      t.turno_id === turnoActualizado.turno_id ? turnoActualizado : t
    ));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Mis turnos</h1>
        <p className={styles.pageSubtitle}>
          Dr/a. <strong>{medico.nombre}</strong> · Mat. {medico.matricula}
        </p>
      </header>

      <div className={styles.tabs} role="tablist">
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
        </div>
      )}

      {!cargando && !error && turnosFiltrados.length > 0 && (
        <div className={styles.lista}>
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
