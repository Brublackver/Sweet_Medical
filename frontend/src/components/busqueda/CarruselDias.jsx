'use client';
import { useRef, useEffect } from 'react';
import styles from './CarruselDias.module.css';

const DIAS  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function parsearFecha(fechaStr) {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function generarRango(desde, hasta) {
  const fechas  = [];
  // Iteración en UTC para que la lista de días no dependa de la zona horaria.
  const current = new Date(`${desde}T00:00:00Z`);
  const end     = new Date(`${hasta}T00:00:00Z`);
  while (current <= end) {
    fechas.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return fechas;
}

export default function CarruselDias({ fechaDesde, fechaHasta, turnosPorDia, diaSeleccionado, onSeleccionar }) {
  const trackRef = useRef(null);
  const itemRefs = useRef({});

  const dias = generarRango(fechaDesde, fechaHasta).filter(
    (fecha) => (turnosPorDia[fecha] ?? 0) > 0,
  );

  useEffect(() => {
    const el = itemRefs.current[diaSeleccionado];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [diaSeleccionado]);

  const scrollPor = (direccion) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: direccion * 5 * 88, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.wrapper} aria-label="Navegación por días">
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => scrollPor(-1)}
        aria-label="Ver días anteriores"
      >
        ‹
      </button>

      <div ref={trackRef} className={styles.track}>
        {dias.map((fecha) => {
          const d            = parsearFecha(fecha);
          const totalTurnos  = turnosPorDia[fecha] ?? 0;
          const activo       = fecha === diaSeleccionado;
          const sinTurnos    = totalTurnos === 0;

          return (
            <button
              key={fecha}
              ref={(el) => { itemRefs.current[fecha] = el; }}
              type="button"
              onClick={() => onSeleccionar(fecha)}
              aria-pressed={activo}
              aria-label={`${d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} — ${totalTurnos} ${totalTurnos === 1 ? 'turno' : 'turnos'}`}
              className={[
                styles.item,
                activo    ? styles.itemActivo  : '',
                sinTurnos ? styles.itemVacio   : '',
              ].join(' ')}
            >
              <span className={styles.weekday}>{DIAS[d.getDay()]}</span>
              <span className={styles.dayNum}>{d.getDate()}</span>
              <span className={styles.mes}>{MESES[d.getMonth()]}</span>
              <span className={styles.badge}>{totalTurnos}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => scrollPor(1)}
        aria-label="Ver días siguientes"
      >
        ›
      </button>
    </div>
  );
}
