'use client';
import { useState, useEffect } from 'react';
import Link              from 'next/link';
import { useRouter }     from 'next/navigation';
import { usePaciente }   from '@/context/PacienteContext';
import { useCarrito }    from '@/context/CarritoContext';
import { reservarTurno } from '@/lib/api';
import ItemConfirmacion    from '@/components/confirmacion/ItemConfirmacion';
import ConfirmacionExito   from '@/components/confirmacion/ConfirmacionExito';
import styles from './Confirmacion.module.css';

/*
  ConfirmacionPage — orquesta la confirmación de las solicitudes del carrito.
  La revisión de cada turno y la pantalla de éxito viven en componentes
  dedicados (ItemConfirmacion, ConfirmacionExito).
*/
export default function ConfirmacionPage() {
  const { paciente, cargado }     = usePaciente();
  const { items, vaciar }         = useCarrito();
  const router                    = useRouter();
  const [confirmado, setConfirmado] = useState(false);
  const [cargando, setCargando]     = useState(false);
  const [turnosConfirmados, setTurnosConfirmados] = useState([]);
  const [errores, setErrores]       = useState([]);

  useEffect(() => {
    if (!cargado) return;
    if (paciente === null) { router.replace('/login'); return; }
    if (!confirmado && items.length === 0) router.replace('/solicitudes');
  }, [paciente, cargado, items, confirmado, router]);

  if (!cargado || !paciente) return null;

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
    return <ConfirmacionExito turnosConfirmados={turnosConfirmados} errores={errores} />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Confirmar solicitud</h1>
        <p className={styles.pageSubtitle}>Revisá los turnos antes de confirmar.</p>
      </header>

      <div className={styles.lista}>
        {items.map((item) => (
          <ItemConfirmacion key={item.key} item={item} />
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
          type="button"
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
