import { CoberturasBadge } from '@/components/ui/Badge';
import { formatearFecha }  from '@/lib/fecha';
import styles from './Carrito.module.css';

export default function ItemCarrito({ item, onQuitar }) {
  return (
    <article
      aria-label={`Turno: ${item.servicio.nombre}`}
      className={styles.item}
    >
      <div className={styles.itemInfo}>
        <div className={styles.itemTituloRow}>
          <p className={styles.itemNombre}>{item.servicio.nombre}</p>
          <CoberturasBadge cobertura={item.cobertura} />
        </div>
        <ul className={styles.itemDetalle}>
          <li className={styles.itemDetalleItem}>
            📅 <span className={styles.capitalize}>{formatearFecha(item.fecha)}</span> a las{' '}
            <strong>{item.hora} hs</strong>
            <span className={styles.itemSecundario}> ({item.servicio.duracionTurnoEnMins} min)</span>
          </li>
          <li className={styles.itemDetalleItem}>
            👨‍⚕️ Dr/a. {item.medico.nombre}{' '}
            <span className={styles.itemSecundario}>(Mat. {item.medico.matricula})</span>
          </li>
          {item.sedes?.[0] && <li className={styles.itemDetalleItem}>📍 {item.sedes[0].nombre}</li>}
        </ul>
      </div>

      <div className={styles.itemPrecio}>
        {item.montoAbonar === 0 ? (
          <p className={styles.itemPrecioGratis}>Sin costo</p>
        ) : (
          <>
            <p className={styles.itemPrecioMonto}>${item.montoAbonar.toLocaleString('es-AR')}</p>
            {item.cobertura === 'PARCIAL' && (
              <p className={styles.itemPrecioTachado}>
                ${item.servicio.costo.toLocaleString('es-AR')}
              </p>
            )}
          </>
        )}
        <button
          onClick={onQuitar}
          aria-label={`Quitar ${item.servicio.nombre} del carrito`}
          className={styles.quitarBtn}
        >
          Quitar
        </button>
      </div>
    </article>
  );
}
