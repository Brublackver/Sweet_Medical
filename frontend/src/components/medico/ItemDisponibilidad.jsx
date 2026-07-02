import Icono from '@/components/ui/Icono';
import { formatearFechaConAnio } from '@/lib/fecha';
import styles from '@/features/medico/Medico.module.css';

/*
  ItemDisponibilidad — fila de una disponibilidad futura con acción de eliminar.
*/
export default function ItemDisponibilidad({ disponibilidad, onEliminar }) {
  const id = disponibilidad.disponibilidad_id ?? disponibilidad.id;

  return (
    <div className={styles.dispItem}>
      <div>
        <p className={styles.dispFecha}>{formatearFechaConAnio(disponibilidad.fecha)}</p>
        <p className={styles.dispHoras}>{disponibilidad.horaDesde} hs — {disponibilidad.horaHasta} hs</p>
      </div>
      <button
        type="button"
        onClick={() => onEliminar(id)}
        aria-label={`Eliminar disponibilidad del ${disponibilidad.fecha}`}
        title="Eliminar disponibilidad"
        className={styles.eliminarBtn}
      >
        <Icono nombre="papelera" tamano={18} />
      </button>
    </div>
  );
}
