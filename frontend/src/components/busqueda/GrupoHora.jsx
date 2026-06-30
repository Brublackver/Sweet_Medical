'use client';
import { useState } from 'react';
import TarjetaTurno from './TarjetaTurno';
import styles from './GrupoHora.module.css';

export default function GrupoHora({ hora, turnos, fecha, inicialExpandido = false }) {
  const [expandido, setExpandido] = useState(inicialExpandido);

  return (
    <div className={styles.grupo}>
      <button
        type="button"
        className={`${styles.header} ${expandido ? styles.headerExpandido : ''}`}
        onClick={() => setExpandido((prev) => !prev)}
        aria-expanded={expandido}
      >
        <div className={styles.headerIzq}>
          <span className={styles.hora}>{hora} hs</span>
          <span className={styles.cantidad}>
            {turnos.length} {turnos.length === 1 ? 'turno' : 'turnos'}
          </span>
        </div>
        <span className={`${styles.chevron} ${expandido ? styles.chevronOpen : ''}`} aria-hidden="true">
          ›
        </span>
      </button>

      <div className={`${styles.contenido} ${expandido ? styles.contenidoExpandido : ''}`}>
        <div className={styles.contenidoInner}>
          <div className={styles.grid}>
            {turnos.map((turno, i) => (
              <TarjetaTurno
                key={`${turno.medico.id}-${hora}-${turno.servicio.id}-${i}`}
                turno={turno}
                fecha={fecha}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
