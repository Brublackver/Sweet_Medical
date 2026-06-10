import { useCarrito }      from '@/context/CarritoContext';
import { CoberturasBadge } from '@/components/ui/Badge';
import styles from '@/features/busqueda/Busqueda.module.css';

export default function TarjetaTurno({ turno, fecha }) {
  const { agregar, quitarTurno, estaAgregado } = useCarrito();
  const item      = { ...turno, fecha };
  const enCarrito = estaAgregado(item);

  const handleToggle = () => enCarrito ? quitarTurno(item) : agregar(item);

  return (
    <article
      aria-label={`Turno: ${turno.servicio.nombre} el ${fecha} a las ${turno.hora}`}
      className={`${styles.tarjeta} ${enCarrito ? styles.tarjetaSeleccionada : ''}`}
    >
      <div className={styles.tarjetaHeader}>
        <div>
          <p className={styles.tarjetaHora}>{turno.hora} hs</p>
          <p className={styles.tarjetaDuracion}>{turno.servicio.duracionTurnoEnMins} min</p>
        </div>
        <CoberturasBadge cobertura={turno.cobertura} />
      </div>

      <div>
        <p className={styles.tarjetaServicio}>{turno.servicio.nombre}</p>
        <p className={styles.tarjetaTipo}>{turno.servicio.tipo}</p>
      </div>

      <div>
        <p className={styles.tarjetaMedico}>Dr/a. {turno.medico.nombre}</p>
        <p className={styles.tarjetaMatricula}>Matr. {turno.medico.matricula}</p>
      </div>

      {turno.sedes?.length > 0 && (
        <p className={styles.tarjetaSede}>
          📍 {turno.sedes[0].nombre}
          {turno.sedes[0].direccion && (
            <span className={styles.tarjetaDireccion}> — {turno.sedes[0].direccion}</span>
          )}
        </p>
      )}

      <div className={styles.tarjetaFooter}>
        <div>
          {turno.montoAbonar === 0 ? (
            <span className={styles.precioGratis}>Sin costo</span>
          ) : (
            <>
              <span className={styles.precio}>${turno.montoAbonar.toLocaleString('es-AR')}</span>
              {turno.cobertura === 'PARCIAL' && (
                <p className={styles.precioTachado}>${turno.servicio.costo.toLocaleString('es-AR')}</p>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleToggle}
          aria-pressed={enCarrito}
          aria-label={enCarrito ? `Quitar ${turno.servicio.nombre} de mis solicitudes` : `Agregar ${turno.servicio.nombre} a mis solicitudes`}
          className={`${styles.agregarBtn} ${enCarrito ? styles.agregarBtnActivo : styles.agregarBtnInactivo}`}
        >
          {enCarrito ? '✓ Solicitado' : '+ Solicitar'}
        </button>
      </div>
    </article>
  );
}
