import Link               from 'next/link';
import { formatearFecha }  from '@/lib/fecha';
import styles from '@/features/confirmacion/Confirmacion.module.css';

/*
  ConfirmacionExito — pantalla final tras enviar la solicitud. Muestra los
  turnos reservados con éxito y, si los hubo, los que fallaron.
*/
export default function ConfirmacionExito({ turnosConfirmados, errores }) {
  const huboExito = turnosConfirmados.length > 0;

  return (
    <div className={styles.successPage}>
      <div className={styles.successCard}>
        <div className={styles.successIcon} aria-hidden="true">{huboExito ? '✅' : '⚠️'}</div>
        <h1 className={styles.successTitle}>
          {huboExito ? '¡Solicitud enviada!' : 'No se pudo reservar'}
        </h1>
        <p className={styles.successText}>
          {huboExito && (
            <>
              {turnosConfirmados.length === 1 ? '1 turno reservado' : `${turnosConfirmados.length} turnos reservados`} correctamente.
              Te avisaremos cuando sea confirmado.
            </>
          )}
        </p>

        {huboExito && (
          <div className={styles.successLista}>
            {turnosConfirmados.map((item) => (
              <div key={item.key} className={styles.successItem}>
                <span className={styles.successCheck} aria-hidden="true">✓</span>
                <div className={styles.successItemInfo}>
                  <p className={styles.successItemNombre}>{item.servicio.nombre}</p>
                  <p className={styles.successItemDetalle}>
                    {formatearFecha(item.fecha)} — {item.hora} hs · {item.medico.nombre}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {errores.length > 0 && (
          <div className={styles.errorLista} role="alert" aria-live="assertive">
            <p className={styles.errorListaTitulo}>⚠️ No se pudieron reservar:</p>
            {errores.map(({ item, msg }) => (
              <div key={item.key} className={styles.errorItem}>
                <p className={styles.errorItemNombre}>{item.servicio.nombre} — {formatearFecha(item.fecha)} {item.hora} hs</p>
                <p className={styles.errorItemMsg}>{msg}</p>
              </div>
            ))}
          </div>
        )}

        <div className={styles.successAcciones}>
          <Link href="/mis-turnos" className={styles.successPrimaryLink}>Ver mis turnos</Link>
          <Link href="/buscar" className={styles.successSecondaryLink}>Buscar más turnos</Link>
        </div>
      </div>
    </div>
  );
}
