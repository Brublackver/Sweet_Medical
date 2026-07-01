'use client';
import { useState, useEffect, useCallback } from 'react';
import Link                    from 'next/link';
import { useRouter }           from 'next/navigation';
import { usePaciente }         from '@/context/PacienteContext';
import { getTurnosPaciente, getProximosTurnosPaciente, getMedico } from '@/lib/api';
import { filtrarTurnos }       from '@/lib/turnos';
import { useRefetchOnFocus }   from '@/hooks/useRefetchOnFocus';
import TarjetaMiTurno          from '@/components/misturno/TarjetaMiTurno';
import ListaPaginada           from '@/components/ui/ListaPaginada';
import EstadoCarga             from '@/components/ui/EstadoCarga';
import Tabs                    from '@/components/ui/Tabs';
import { SkeletonDia }         from '@/components/ui/Skeleton';
import styles from './MisTurnos.module.css';

const FILTROS = [
  { key: 'todos',        label: 'Todos' },
  { key: 'proximos',     label: 'Próximos' },
  { key: 'realizado',    label: 'Realizados' },
  { key: 'no_realizado', label: 'No realizados' },
  { key: 'cancelado',    label: 'Cancelados' },
];

const inferirServicio = (snapshot, duracion) => {
  if (snapshot) {
    const todas = [
      ...(snapshot.especialidades ?? []).map((e) => ({ nombre: e.nombre, tipo: 'especialidad', duracionTurnoEnMins: e.duracionTurnoEnMins, costo: e.costo ?? null })),
      ...(snapshot.practicas      ?? []).map((p) => ({ nombre: p.nombre, tipo: 'práctica',     duracionTurnoEnMins: p.duracionTurnoEnMins, costo: p.costo ?? null })),
    ];
    const match = todas.find((s) => s.duracionTurnoEnMins === duracion);
    if (match) return match;
  }
  return { nombre: 'Turno médico', tipo: 'consulta', duracionTurnoEnMins: duracion, costo: null };
};

const calcularCobertura = (coberturaGeneral) => {
  if (coberturaGeneral == null) return null;
  if (coberturaGeneral === 100) return 'COMPLETA';
  if (coberturaGeneral > 0)    return 'PARCIAL';
  return 'NO_CUBIERTA';
};

const mapTurno = (t) => {
  const servicio = inferirServicio(t.snapshotMedico, t.duracion);
  const plan = t.snapshotPaciente?.plan ?? null;
  const cobertura = calcularCobertura(plan?.coberturaGeneral);
  const montoAbonar = servicio.costo != null
    ? Math.round(servicio.costo * (1 - (plan?.coberturaGeneral ?? 0) / 100))
    : null;

  return {
    id:                   t.turno_id,
    fecha:                t.fecha,
    hora:                 t.hora,
    duracion:             t.duracion,
    estado:               t.estado,
    propuestaMedicoFecha: t.propuestaMedicoFecha ?? null,
    medico: {
      nombre:    t.snapshotMedico?.nombre    ?? 'Médico',
      matricula: t.snapshotMedico?.matricula ?? '-',
    },
    servicio,
    sede:        null,
    cobertura,
    montoAbonar,
  };
};

export default function MisTurnosPage() {
  const { paciente, cargado, logout } = usePaciente();
  const router                    = useRouter();
  const [filtro, setFiltro]       = useState('todos');
  const [turnos, setTurnos]       = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState('');

  // `silencioso` evita el skeleton cuando refrescamos en segundo plano (al volver
  // a la pestaña): la lista se actualiza sin parpadear.
  const cargar = useCallback((silencioso = false) => {
    if (!cargado || !paciente) return;

    if (!silencioso) setCargando(true);
    setError('');

    // Para "Próximos" delegamos en el backend: ya vienen ordenados de forma
    // ascendente y sin los turnos pasados. Para el resto traemos el historial
    // completo y filtramos por estado del lado del cliente.
    const fuente = filtro === 'proximos'
      ? getProximosTurnosPaciente(paciente.paciente_id)
      : getTurnosPaciente(paciente.paciente_id);

    fuente
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
          router.replace('/login');
        } else {
          setError('No pudimos cargar tus turnos. Intentá de nuevo.');
        }
      })
      .finally(() => { if (!silencioso) setCargando(false); });
  }, [paciente, cargado, filtro, logout, router]);

  useEffect(() => {
    if (!cargado) return;
    if (paciente === null) { router.replace('/login'); return; }
    cargar();
  }, [cargado, paciente, router, cargar]);

  // Si el médico resolvió un cambio mientras el paciente miraba esta pantalla,
  // al volver a la pestaña traemos el estado real (sin parpadeo).
  useRefetchOnFocus(useCallback(() => cargar(true), [cargar]));

  // Polling activo solo mientras haya turnos esperando respuesta del médico.
  // Cero tráfico cuando no hay nada pendiente; se limpia solo cuando se resuelven.
  const hayPendientes = turnos.some((t) => t.estado === 'pendiente_cambio');
  useEffect(() => {
    if (!hayPendientes) return;
    const id = setInterval(() => cargar(true), 20_000);
    return () => clearInterval(id);
  }, [hayPendientes, cargar]);

  if (!cargado || !paciente) return null;

  // En "Próximos" el backend ya filtró/ordenó; en el resto filtramos por estado.
  const turnosFiltrados = filtro === 'proximos' ? turnos : filtrarTurnos(turnos, filtro);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Mis turnos</h1>
        <p className={styles.pageSubtitle}>
          Hola <strong>{paciente.nombre}</strong>, acá encontrás todos tus turnos.
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
        vacio={turnosFiltrados.length === 0}
        slotCargando={<SkeletonDia />}
        slotVacio={
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
              <Link href="/buscar" className={styles.buscarLink}>
                🔍 Buscar turnos
              </Link>
            )}
          </div>
        }
      >
        <ListaPaginada
          items={turnosFiltrados}
          getKey={(turno) => turno.id}
          variante="lista"
          porPagina={5}
          ariaLabel="Tus turnos"
          renderItem={(turno) => (
            <TarjetaMiTurno
              turno={turno}
              pacienteId={paciente.paciente_id}
              onActualizar={(turnoActualizado) =>
                setTurnos((prev) => prev.map((t) =>
                  t.id === turnoActualizado.turno_id ? mapTurno(turnoActualizado) : t
                ))
              }
            />
          )}
        />
      </EstadoCarga>
    </div>
  );
}
