'use client';

import { useState, useEffect } from 'react';
import Link            from 'next/link';
import { useRouter }   from 'next/navigation';
import { usePaciente } from '@/context/PacienteContext';
import { useCarrito }  from '@/context/CarritoContext';
import { reservarTurno }    from '@/lib/api';
import { CoberturasBadge }  from '@/components/ui/Badge';
import { formatearFecha }   from '@/lib/fecha';
import styles from './Confirmacion.module.css';

export default function ConfirmacionPage() {
  const { paciente }              = usePaciente();
  const { items, vaciar }         = useCarrito();
  const router                    = useRouter();
  const [confirmado, setConfirmado] = useState(false);
  const [cargando, setCargando]     = useState(false);
  const [turnosConfirmados, setTurnosConfirmados] = useState([]);
  const [errores, setErrores]       = useState([]);

  useEffect(() => {
    if (paciente === null) { router.replace('/login'); return; }
    if (!confirmado && items.length === 0) router.replace('/solicitudes');
  }, [paciente, items, confirmado, router]);

  if (!paciente) return null;

  const total = items.reduce((sum, item) => sum + (item.montoAbonar ?? 0), 0);

  const handleConfirmar = () => {
    setCargando(true);
    setErrores([]);
    const snapItems = [...items];
    Promise.allSettled(
      snapItems.map((item) =>
        reservarTurno(paciente.paciente_id, {
          medicoId: item.medico.id,
          fecha:    item.fecha,
          hora:     item.hora,
          duracion: item.servicio.duracionTurnoEnMins,
        }).then(() => ({ ok: true, item }))
          .catch((err) => {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Error al reservar.';
            return { ok: false, item, msg };
          })
      )
    ).then((results) => {
      const exitosos = results.filter((r) => r.status === 'fulfilled' && r.value.ok).map((r) => r.value.item);
      const fallidos = results.filter((r) => r.status === 'fulfilled' && !r.value.ok).map((r) => r.value);
      vaciar();
      setTurnosConfirmados(exitosos);
      setErrores(fallidos);
      setConfirmado(true);
    }).finally(() => setCargando(false));
  };

  if (confirmado) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <div className={styles.successIcon} aria-hidden="true">
            {turnosConfirmados.length > 0 ? '✅' : '⚠️'}
          </div>
          <h1 className={styles.successTitle}>
            {turnosConfirmados.length > 0 ? '¡Solicitud enviada!' : 'No se pudo reservar'}
          </h1>
          <p className={styles.successText}>
            {turnosConfirmados.length > 0 && (
              <>
                {turnosConfirmados.length === 1 ? '1 turno reservado' : `${turnosConfirmados.length} turnos reservados`} correctamente.
                Te avisaremos cuando sea confirmado.
              </>
            )}
          </p>

          {turnosConfirmados.length > 0 && (
            <div className={styles.successLista}>
              {turnosConfirmados.map((item) => (
                <div key={item.key} className={styles.successItem}>
                  <span className={styles.successCheck} aria-hidden="true">✓</span>
                  <div className={styles.successItemInfo}>
                    <p className={styles.successItemNombre}>{item.servicio.nombre}</p>
                    <p className={styles.successItemDetalle}>
                      {formatearFecha(item.fecha)} — {item.hora} hs · Dr/a. {item.medico.nombre}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {errores.length > 0 && (
            <div className={styles.errorLista}>
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
            <Link href="/mis-turnos" className={styles.successPrimaryLink}>
              Ver mis turnos
            </Link>
            <Link href="/buscar" className={styles.successSecondaryLink}>
              Buscar más turnos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Confirmar solicitud</h1>
        <p className={styles.pageSubtitle}>Revisá los turnos antes de confirmar.</p>
      </header>

      <div className={styles.lista}>
        {items.map((item) => (
          <article
            key={item.key}
            aria-label={`Turno: ${item.servicio.nombre}`}
            className={styles.item}
          >
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
              <p className={styles.itemMedico}>Dr/a. {item.medico.nombre} · {item.sedes?.[0]?.nombre}</p>
            </div>
            <div className={styles.itemPrecio}>
              {item.montoAbonar === 0
                ? <p className={styles.itemPrecioGratis}>Sin costo</p>
                : <p className={styles.itemPrecioMonto}>${item.montoAbonar.toLocaleString('es-AR')}</p>
              }
            </div>
          </article>
        ))}
      </div>

      <div className={styles.totalCard}>
        <div>
          <p className={styles.totalLabel}>Total estimado</p>
          <p className={styles.totalMonto}>${total.toLocaleString('es-AR')}</p>
        </div>
        <p className={styles.totalNota}>
          Sujeto a confirmación según disponibilidad.
        </p>
      </div>

      <div className={styles.acciones}>
        <button
          onClick={handleConfirmar}
          disabled={cargando}
          className={styles.confirmarBtn}
        >
          {cargando ? (
            <>
              <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className={styles.spinnerCircle} />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className={styles.spinnerPath} />
              </svg>
              Enviando solicitud...
            </>
          ) : 'Confirmar solicitud'}
        </button>
        <Link href="/solicitudes" className={styles.volverLink}>
          Volver a mis solicitudes
        </Link>
      </div>
    </div>
  );
}
