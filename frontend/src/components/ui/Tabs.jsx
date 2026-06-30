'use client';
import styles from './Tabs.module.css';

/*
  Tabs — grupo de filtros mutuamente excluyentes (chips). Centraliza el patrón
  que antes estaba duplicado en MisTurnos, Notificaciones y Disponibilidad.

  Usa el patrón de "toggle buttons en un group" (role="group" + aria-pressed)
  en lugar de role="tablist", porque el patrón ARIA de tablist exige navegación
  con flechas (roving tabindex). Para chips de filtro, los toggle buttons son
  el patrón accesible correcto sin esa complejidad.

  Props:
    items     → [{ key, label, badge? }]. badge es un número opcional.
    value     → key del item activo.
    onChange  → (key) => void.
    ariaLabel → etiqueta accesible del grupo.
*/
export default function Tabs({ items, value, onChange, ariaLabel }) {
  return (
    <div className={styles.tabs} role="group" aria-label={ariaLabel}>
      {items.map(({ key, label, badge }) => {
        const activo = value === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(key)}
            className={`${styles.tab} ${activo ? styles.tabActivo : ''}`}
          >
            {label}
            {badge != null && badge > 0 && (
              <span className={styles.badge} aria-hidden="true">{badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
