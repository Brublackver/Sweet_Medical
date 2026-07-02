import TarjetaTurno from './TarjetaTurno';
import styles from './GrupoHora.module.css';

export default function GrupoHora({ hora, turnos, fecha, expandido, onToggle }) {
  return (
    <div className={styles.grupo}>
      <button
        type="button"
        className={`${styles.header} ${expandido ? styles.headerExpandido : ''}`}
        onClick={onToggle}
        aria-expanded={expandido}
        aria-label={`${expandido ? 'Colapsar' : 'Expandir'} horario ${hora} hs — ${turnos.length} ${turnos.length === 1 ? 'turno' : 'turnos'}`}
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
