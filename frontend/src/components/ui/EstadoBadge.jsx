import styles from './Badge.module.css';

const clasesEstado = {
  reservado:        styles.reservado,
  realizado:        styles.realizado,
  cancelado:        styles.cancelado,
  no_realizado:     styles.noRealizado,
  pendiente_cambio: styles.pendienteCambio,
  propuesta_medico: styles.propuestaMedico,
};

const etiquetasEstado = {
  reservado:        '● Reservado',
  realizado:        '✓ Realizado',
  cancelado:        '✕ Cancelado',
  no_realizado:     '⊘ No realizado',
  pendiente_cambio: '⟳ Cambio pendiente',
  propuesta_medico: '⟳ Propuesta médico',
};

export function EstadoBadge({ estado }) {
  return (
    <span className={`${styles.badge} ${clasesEstado[estado] ?? styles.default}`}>
      {etiquetasEstado[estado] ?? estado}
    </span>
  );
}
