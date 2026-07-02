'use client';
import { formatearFechaConAnio } from '@/lib/fecha';
import styles from '@/features/medico/Medico.module.css';

// Cada estado lleva ÍCONO + TEXTO: nunca dependemos solo del color (WCAG 1.4.1).
const ESTADO_LABEL = {
  reservado:        { texto: '● Reservado',        clase: 'estadoReservado' },
  cancelado:        { texto: '✕ Cancelado',         clase: 'estadoCancelado' },
  realizado:        { texto: '✓ Realizado',         clase: 'estadoRealizado' },
  pendiente_cambio: { texto: '⟳ Cambio pendiente',  clase: 'estadoPendienteCambio' },
  propuesta_medico: { texto: '⟳ Propuesta enviada', clase: 'estadoPropuestaMedico' },
};

const nombreServicio = (t) =>
  t.snapshotMedico?.especialidades?.[0]?.nombre
  ?? t.snapshotMedico?.practicas?.[0]?.nombre
  ?? '—';

/*
  HistorialDia — acordeón de un día pasado con los turnos atendidos.
  Props:
    disponibilidad → el tramo (fecha, horaDesde, horaHasta).
    turnos         → turnos de ese día (ya filtrados y ordenados por el padre).
    turnosCargados → si ya se cargaron los turnos del médico.
    expandido      → estado abierto/cerrado.
    onToggle       → alterna expandido.
*/
export default function HistorialDia({ disponibilidad, turnos, turnosCargados, expandido, onToggle }) {
  return (
    <div className={styles.historialDia}>
      <button
        type="button"
        className={styles.historialDiaHeader}
        onClick={onToggle}
        aria-expanded={expandido}
      >
        <div className={styles.historialDiaInfo}>
          <p className={styles.historialDiaFecha}>{formatearFechaConAnio(disponibilidad.fecha)}</p>
          <p className={styles.historialDiaHoras}>{disponibilidad.horaDesde} hs — {disponibilidad.horaHasta} hs</p>
        </div>
        <div className={styles.historialDiaMeta}>
          {turnosCargados && (
            <span className={styles.historialDiaBadge}>
              {turnos.length === 0 ? 'Sin turnos' : `${turnos.length} turno${turnos.length !== 1 ? 's' : ''}`}
            </span>
          )}
          <span className={styles.historialChevron} aria-hidden="true">
            {expandido ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {expandido && (
        <div className={styles.historialDiaTurnos}>
          {!turnosCargados && <p className={styles.cargandoText}>Cargando turnos...</p>}
          {turnosCargados && turnos.length === 0 && (
            <p className={styles.historialSinTurnos}>Sin turnos registrados para este día.</p>
          )}
          {turnosCargados && turnos.map((t) => {
            const estado = ESTADO_LABEL[t.estado] ?? { texto: t.estado, clase: 'estadoDesconocido' };
            return (
              <div key={t.turno_id ?? t.turnoId} className={styles.historialTurnoRow}>
                <span className={styles.historialTurnoHora}>{t.hora} hs</span>
                <span className={styles.historialTurnoServicio}>{nombreServicio(t)}</span>
                <span className={styles.historialTurnoPaciente}>{t.snapshotPaciente?.nombre ?? '—'}</span>
                <span className={`${styles.historialTurnoEstado} ${styles[estado.clase] ?? ''}`}>
                  {estado.texto}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
