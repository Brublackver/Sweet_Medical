'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter }           from 'next/navigation';
import { useMedico }           from '@/context/MedicoContext';
import { getTurnosMedico }     from '@/lib/api';
import { filtrarTurnos }       from '@/lib/turnos';
import { hoyISO, formatearFechaConAnio } from '@/lib/fecha';
import { useRefetchOnFocus }   from '@/hooks/useRefetchOnFocus';
import TarjetaTurnoMedico      from '@/components/medico/TarjetaTurnoMedico';
import CarruselDias            from '@/components/ui/CarruselDias';
import ListaPaginada           from '@/components/ui/ListaPaginada';
import EstadoCarga             from '@/components/ui/EstadoCarga';
import Tabs                    from '@/components/ui/Tabs';
import { SkeletonDia }         from '@/components/ui/Skeleton';
import styles from './Medico.module.css';

const FILTROS = [
  { key: 'todos',           label: 'Todos' },
  { key: 'proximos',        label: 'Próximos' },
  { key: 'pendiente_cambio', label: 'Cambios pendientes' },
  { key: 'realizado',       label: 'Realizados' },
  { key: 'no_realizado',    label: 'No realizados' },
  { key: 'cancelado',       label: 'Cancelados' },
];

// Tabs "de agenda": al médico solo le importan los turnos que vienen, los pasados
// se ocultan. Las tabs históricas (Realizados/Cancelados/No realizados) SÍ muestran
// días pasados — para eso existen.
const SOLO_FUTUROS = ['todos', 'proximos'];

export default function MedicoTurnosPage() {
  const { medico, cargado, logout } = useMedico();
  const router                   = useRouter();
  // El médico aterriza en "Próximos": los turnos que va a atender. Cancelados y
  // realizados quedan a un clic en sus tabs, pero no son el foco al entrar.
  const [filtro, setFiltro]      = useState('proximos');
  const [turnos, setTurnos]      = useState([]);
  const [cargando, setCargando]  = useState(true);
  const [error, setError]        = useState('');
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // "YYYY-MM-DD"

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

  const turnosFiltrados = useMemo(
    () => filtrarTurnos(turnos, filtro),
    [turnos, filtro],
  );

  // En las tabs de agenda descartamos los turnos ya vencidos: los pasados no
  // importan. En las históricas dejamos todo tal cual.
  const turnosVisibles = useMemo(() => {
    if (!SOLO_FUTUROS.includes(filtro)) return turnosFiltrados;
    const hoy = hoyISO();
    return turnosFiltrados.filter((t) => t.fecha >= hoy);
  }, [turnosFiltrados, filtro]);

  // Cantidad de turnos por día → alimenta la barra de navegación (badge).
  const turnosPorDia = useMemo(() => {
    const acc = {};
    for (const t of turnosVisibles) acc[t.fecha] = (acc[t.fecha] ?? 0) + 1;
    return acc;
  }, [turnosVisibles]);

  // Días con turnos, ascendente. turnosVisibles ya viene ordenado del backend.
  const dias = useMemo(
    () => Object.keys(turnosPorDia).sort((a, b) => a.localeCompare(b)),
    [turnosPorDia],
  );

  // Selección por defecto: el primer día de hoy en adelante; si todos son
  // pasados (p.ej. tab Cancelados/Realizados), el más reciente. Conserva la
  // selección vigente si sigue siendo válida al cambiar de filtro o refrescar.
  useEffect(() => {
    if (dias.length === 0) { setDiaSeleccionado(null); return; }
    setDiaSeleccionado((actual) => {
      if (actual && dias.includes(actual)) return actual;
      const hoy = hoyISO();
      return dias.find((d) => d >= hoy) ?? dias[dias.length - 1];
    });
  }, [dias]);

  const turnosDelDia = useMemo(
    () => turnosVisibles.filter((t) => t.fecha === diaSeleccionado),
    [turnosVisibles, diaSeleccionado],
  );

  if (!cargado || !medico) return null;

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

      <Tabs
        items={FILTROS}
        value={filtro}
        onChange={setFiltro}
        ariaLabel="Filtrar turnos"
      />

      <EstadoCarga
        cargando={cargando}
        error={error}
        textoError={error}
        vacio={turnosVisibles.length === 0}
        slotCargando={<SkeletonDia />}
        slotVacio={
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon} aria-hidden="true">📋</p>
            <h2 className={styles.emptyTitle}>
              {turnos.length === 0
                ? 'No tenés turnos registrados'
                : SOLO_FUTUROS.includes(filtro)
                  ? 'No tenés turnos próximos'
                  : 'No hay turnos en esta categoría'}
            </h2>
          </div>
        }
      >
        {dias.length > 0 && diaSeleccionado && (
          <CarruselDias
            fechaDesde={dias[0]}
            fechaHasta={dias[dias.length - 1]}
            turnosPorDia={turnosPorDia}
            diaSeleccionado={diaSeleccionado}
            onSeleccionar={setDiaSeleccionado}
          />
        )}

        {diaSeleccionado && (
          <h2 className={styles.diaTitulo}>
            {formatearFechaConAnio(diaSeleccionado)}
            <span className={styles.diaConteo}>
              {' · '}{turnosDelDia.length} {turnosDelDia.length === 1 ? 'turno' : 'turnos'}
            </span>
          </h2>
        )}

        <ListaPaginada ariaLabel="Turnos del médico" variante="lista" porPagina={5}>
          {turnosDelDia.map((turno) => (
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
