import TarjetaTurno       from './TarjetaTurno';
import Carousel           from '@/components/ui/Carousel';
import { formatearFecha } from '@/lib/fecha';
import styles from '@/features/busqueda/Busqueda.module.css';

export default function ResultadosDia({ dia }) {
  return (
    <section aria-label={`Turnos del ${dia.fecha}`}>
      <div className={styles.diaHeader}>
        <h2 className={styles.diaTitle}>{formatearFecha(dia.fecha)}</h2>
        <span className={styles.diaBadge}>
          {dia.turnos.length} {dia.turnos.length === 1 ? 'turno' : 'turnos'}
        </span>
      </div>

      <Carousel ariaLabel={`Turnos disponibles del ${formatearFecha(dia.fecha)}`}>
        {dia.turnos.map((turno, i) => (
          <TarjetaTurno
            key={`${turno.medico.id}-${turno.hora}-${turno.servicio.id}-${i}`}
            turno={turno}
            fecha={dia.fecha}
          />
        ))}
      </Carousel>
    </section>
  );
}
