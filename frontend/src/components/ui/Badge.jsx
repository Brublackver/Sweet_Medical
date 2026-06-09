import styles from './Badge.module.css';

const clasesCobertura = {
  COMPLETA:    styles.completa,
  PARCIAL:     styles.parcial,
  NO_CUBIERTA: styles.noCubierta,
};

const etiquetasCobertura = {
  COMPLETA:    '✓ Cobertura total',
  PARCIAL:     '◑ Cobertura parcial',
  NO_CUBIERTA: '✕ Sin cobertura',
};

export function CoberturasBadge({ cobertura }) {
  return (
    <span className={`${styles.badge} ${clasesCobertura[cobertura] ?? styles.default}`}>
      {etiquetasCobertura[cobertura] ?? cobertura}
    </span>
  );
}
