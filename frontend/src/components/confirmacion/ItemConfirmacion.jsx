import { CoberturasBadge } from '@/components/ui/Badge';
import { formatearFecha }  from '@/lib/fecha';
import styles from '@/features/confirmacion/Confirmacion.module.css';

/*
  ItemConfirmacion — tarjeta de revisión de un turno antes de confirmar.
*/
export default function ItemConfirmacion({ item }) {
  return (
    <article aria-label={`Turno: ${item.servicio.nombre}`} className={styles.item}>
      <div className={styles.itemHora}>
        <p className={styles.itemHoraNum}>{item.hora}</p>
        <p className={styles.itemHoraLabel}>hs</p>
      </div>
      <div className={styles.itemInfo}>
        <div className={styles.itemTituloRow}>
          <p className={styles.itemNombre}>{item.servicio.nombre}</p>
          <CoberturasBadge cobertura={item.cobertura} />
        </div>
        <p className={styles.itemFecha}>{formatearFecha(item.fecha)}</p>
        <p className={styles.itemMedico}>{item.medico.nombre} · {item.sedes?.[0]?.nombre}</p>
      </div>
      <div className={styles.itemPrecio}>
        {item.montoAbonar === 0
          ? <p className={styles.itemPrecioGratis}>Sin costo</p>
          : <p className={styles.itemPrecioMonto}>${item.montoAbonar.toLocaleString('es-AR')}</p>}
      </div>
    </article>
  );
}
