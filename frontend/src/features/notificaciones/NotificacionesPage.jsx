'use client';
import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { usePaciente }         from '@/context/PacienteContext';
import { useMedico }           from '@/context/MedicoContext';
import { useNotificaciones }   from '@/hooks/useNotificaciones';
import { formatearFecha }      from '@/lib/fecha';
import ListaPaginada           from '@/components/ui/ListaPaginada';
import EstadoCarga             from '@/components/ui/EstadoCarga';
import { SkeletonDia }         from '@/components/ui/Skeleton';
import styles from './Notificaciones.module.css';

const FILTROS = [
  { key: 'todas',   label: 'Todas' },
  { key: 'sinLeer', label: 'Sin leer' },
];

/*
  NotificacionesPage — página dedicada de notificaciones.

  Sirve igual para médico y paciente: infiere el tipo desde el context que esté
  logueado. Reusa el hook useNotificaciones (misma lógica que la campana), así
  que aceptar/rechazar funciona idéntico — sólo cambia el contenedor visual.
*/
export default function NotificacionesPage() {
  const { paciente, cargado: pacienteCargado } = usePaciente();
  const { medico,   cargado: medicoCargado }   = useMedico();
  const router                = useRouter();
  const [filtro, setFiltro]   = useState('todas');

  const cargado     = pacienteCargado && medicoCargado;
  const usuarioTipo = medico ? 'MEDICO' : paciente ? 'PACIENTE' : null;
  const usuarioId   = medico?.medico_id ?? paciente?.paciente_id ?? null;

  const {
    notificaciones, error, procesandoId,
    marcarLeida, responder, esAccionable,
  } = useNotificaciones(usuarioTipo, usuarioId);

  useEffect(() => {
    if (cargado && !usuarioId) router.replace('/login');
  }, [cargado, usuarioId, router]);

  if (!cargado || !usuarioId) return null;

  const filtradas = notificaciones.filter((n) => {
    if (filtro === 'sinLeer') return !n.leida;
    return true;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Notificaciones</h1>
        <p className={styles.pageSubtitle}>
          {usuarioTipo === 'MEDICO'
            ? 'Solicitudes de cambio y avisos de tus pacientes.'
            : 'Propuestas de cambio y avisos de tus turnos.'}
        </p>
      </header>

      <div className={styles.tabs} role="group" aria-label="Filtrar notificaciones">
        {FILTROS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={filtro === key}
            onClick={() => setFiltro(key)}
            className={`${styles.tab} ${filtro === key ? styles.tabActivo : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className={styles.errorMsg}>⚠️ {error}</p>}

      <EstadoCarga
        cargando={false}
        vacio={filtradas.length === 0}
        slotCargando={<SkeletonDia />}
        slotVacio={
          <div className={styles.emptyState} role="status">
            <p className={styles.emptyIcon} aria-hidden="true">🔔</p>
            <h2 className={styles.emptyTitle}>
              {notificaciones.length === 0
                ? 'No tenés notificaciones'
                : 'No hay notificaciones en esta categoría'}
            </h2>
            <p className={styles.emptyText}>
              {notificaciones.length === 0
                ? 'Cuando haya novedades en tus turnos, las vas a ver acá.'
                : 'Probá con otro filtro.'}
            </p>
          </div>
        }
      >
        <ListaPaginada
          items={filtradas}
          getKey={(n) => n.notificacion_id}
          porPagina={8}
          ariaLabel="Tus notificaciones"
          renderItem={(n) => {
            const accionable = esAccionable(n);
            const procesando = procesandoId === n.notificacion_id;
            return (
              <article className={`${styles.notif} ${n.leida ? '' : styles.notifSinLeer}`}>
                <div className={styles.notifFila}>
                  <div className={styles.notifTexto}>
                    {!n.leida && <span className={styles.srOnly}>Sin leer. </span>}
                    <p className={styles.notifMensaje}>{n.mensaje}</p>
                    {n.resultado && (
                      <span className={`${styles.resultadoTag} ${n.resultado === 'ACEPTADO' ? styles.resultadoAceptado : styles.resultadoRechazado}`}>
                        {n.resultado === 'ACEPTADO' ? '✓ Aceptado' : '✕ Rechazado'}
                      </span>
                    )}
                    {n.fechaCreacion && (
                      <time className={styles.notifFecha} dateTime={n.fechaCreacion}>
                        {formatearFecha(n.fechaCreacion.slice(0, 10))}
                      </time>
                    )}
                  </div>
                  {!n.leida && !accionable && (
                    <div className={styles.iconAcciones} role="group" aria-label="Acciones de la notificación">
                      <button
                        type="button"
                        className={styles.btnCheck}
                        onClick={() => marcarLeida(n.notificacion_id)}
                        aria-label="Marcar esta notificación como leída"
                        title="Marcar como leída"
                      >
                        <span aria-hidden="true">✓</span>
                      </button>
                      <button
                        type="button"
                        className={styles.btnCruz}
                        onClick={() => marcarLeida(n.notificacion_id)}
                        aria-label="Descartar esta notificación"
                        title="Descartar"
                      >
                        <span aria-hidden="true">✕</span>
                      </button>
                    </div>
                  )}
                </div>

                {accionable && (
                  <div className={styles.acciones} role="group" aria-label="Responder al cambio de fecha">
                    <button
                      type="button"
                      className={styles.btnAceptar}
                      disabled={procesando}
                      aria-label="Aceptar el cambio de fecha"
                      onClick={() => responder(n, true)}
                    >
                      <span aria-hidden="true">✓ </span>
                      {procesando ? 'Procesando...' : 'Aceptar'}
                    </button>
                    <button
                      type="button"
                      className={styles.btnRechazar}
                      disabled={procesando}
                      aria-label="Rechazar el cambio de fecha"
                      onClick={() => responder(n, false)}
                    >
                      <span aria-hidden="true">✕ </span>
                      {procesando ? 'Procesando...' : 'Rechazar'}
                    </button>
                  </div>
                )}
              </article>
            );
          }}
        />
      </EstadoCarga>
    </div>
  );
}
