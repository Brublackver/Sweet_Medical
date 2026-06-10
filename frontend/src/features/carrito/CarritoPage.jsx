'use client';
import { useEffect }   from 'react';
import Link            from 'next/link';
import { useRouter }   from 'next/navigation';
import { usePaciente } from '@/context/PacienteContext';
import { useCarrito }  from '@/context/CarritoContext';
import ItemCarrito     from '@/components/carrito/ItemCarrito';
import Carousel        from '@/components/ui/Carousel';
import styles from './Carrito.module.css';

export default function CarritoPage() {
  const { paciente }              = usePaciente();
  const { items, quitar, vaciar } = useCarrito();
  const router                    = useRouter();

  useEffect(() => {
    if (paciente === null) router.replace('/login');
  }, [paciente, router]);

  if (!paciente) return null;

  const total = items.reduce((sum, item) => sum + (item.montoAbonar ?? 0), 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Mis solicitudes</h1>
          <p className={styles.pageSubtitle}>
            {items.length === 0
              ? 'No tenés turnos en tu lista de solicitudes todavía.'
              : `${items.length} ${items.length === 1 ? 'turno por solicitar' : 'turnos por solicitar'}`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={vaciar}
            aria-label="Limpiar todas las solicitudes"
            className={styles.limpiarBtn}
          >
            Limpiar lista
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon} aria-hidden="true">🗓️</p>
          <h2 className={styles.emptyTitle}>No hay turnos en tu lista</h2>
          <p className={styles.emptyText}>
            Buscá turnos disponibles y agregálos a tus solicitudes.
          </p>
          <Link href="/buscar" className={styles.buscarLink}>
            Buscar turnos
          </Link>
        </div>
      ) : (
        <div>
          <Carousel ariaLabel="Turnos en tu lista de solicitudes">
            {items.map((item) => (
              <ItemCarrito key={item.key} item={item} onQuitar={() => quitar(item.key)} />
            ))}
          </Carousel>

          <div className={styles.resumen}>
            <div className={styles.resumenInner}>
              <div>
                <p className={styles.totalLabel}>Total estimado a abonar</p>
                <p className={styles.totalMonto}>
                  ${total.toLocaleString('es-AR')}
                </p>
                <p className={styles.totalNota}>
                  El monto puede variar según tu cobertura al momento de la consulta.
                </p>
              </div>
              <Link href="/buscar" className={styles.seguirLink}>
                Seguir buscando turnos
              </Link>
            </div>
            <Link href="/confirmar" className={styles.confirmarLink}>
              Confirmar solicitud →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
