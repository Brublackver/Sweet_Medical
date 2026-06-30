'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter }           from 'next/navigation';
import { useMedico }           from '@/context/MedicoContext';
import { getTurnosMedico }     from '@/lib/api';
import { filtrarTurnos }       from '@/lib/turnos';
import { useRefetchOnFocus }   from '@/hooks/useRefetchOnFocus';
import TarjetaTurnoMedico      from '@/components/medico/TarjetaTurnoMedico';
import ListaPaginada           from '@/components/ui/ListaPaginada';
import EstadoCarga             from '@/components/ui/EstadoCarga';
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
  const { medico, cargado, logout } = useMedico();
  const router                   = useRouter();
  const [filtro, setFiltro]      = useState('todos');
  const [turnos, setTurnos]      = useState([]);
  const [cargando, setCargando]  = useState(true);
  const [error, setError]        = useState('');

  // `silencioso` evita el skeleton al refrescar en segundo plano (al volver a la pestaña).
  const cargar = useCallback((silencioso = false) => {
    if (!cargado || !medico) return;
    if (!silencioso) setCargando(true);
    getTurnosMedico(medico.medico_id)
      .then(setTurnos)
      .catch((err) => {
        if (err.response?.status === 404) {
          logout();
          router.replace('/login');
        } else {
          setError('No pudimos cargar los turnos. Intentá de nuevo.');
        }
      })
      .finally(() => { if (!silencioso) setCargando(false); });
  }, [medico, cargado, logout, router]);

  useEffect(() => {
    if (!cargado) return;
    if (medico === null) { router.replace('/login'); return; }
    cargar();
  }, [cargado, medico, router, cargar]);

  // Si el paciente respondió una propuesta mientras el médico miraba esta pantalla,
  // al volver a la pestaña traemos el estado real (sin parpadeo).
  useRefetchOnFocus(useCallback(() => cargar(true), [cargar]));

  // Polling activo solo mientras haya turnos esperando respuesta del paciente.
  const hayPendientes = turnos.some((t) => t.estado === 'propuesta_medico');
  useEffect(() => {
    if (!hayPendientes) return;
    const id = setInterval(() => cargar(true), 20_000);
    return () => clearInterval(id);
  }, [hayPendientes, cargar]);

  if (!cargado || !medico) return null;

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

      <EstadoCarga
        cargando={cargando}
        error={error}
        textoError={error}
        vacio={turnosFiltrados.length === 0}
        slotCargando={<SkeletonDia />}
        slotVacio={
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon} aria-hidden="true">📋</p>
            <h2 className={styles.emptyTitle}>
              {turnos.length === 0 ? 'No tenés turnos registrados' : 'No hay turnos en esta categoría'}
            </h2>
          </div>
        }
      >
        <ListaPaginada ariaLabel="Turnos del médico" variante="lista" porPagina={5}>
          {turnosFiltrados.map((turno) => (
            <TarjetaTurnoMedico
              key={turno.turno_id}
              turno={turno}
              medicoId={medico.medico_id}
              onActualizar={handleActualizar}
            />
          ))}
        </ListaPaginada>
      </EstadoCarga>
    </div>
  );
}
