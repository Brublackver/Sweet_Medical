'use client';
import { useState, useEffect } from 'react';
import { useRouter }   from 'next/navigation';
import { usePaciente }  from '@/context/PacienteContext';
import { buscarTurnos } from '@/lib/api';
import FiltrosBusqueda  from '@/components/busqueda/FiltrosBusqueda';
import ResultadosDia    from '@/components/busqueda/ResultadosDia';
import { SkeletonDia }  from '@/components/ui/Skeleton';
import styles from './Busqueda.module.css';

export default function BuscarPage() {
  const { paciente }                    = usePaciente();
  const router                          = useRouter();
  const [resultados, setResultados]     = useState(null);
  const [cargando,   setCargando]       = useState(false);
  const [error,      setError]          = useState('');

  useEffect(() => {
    if (paciente === null) router.replace('/login');
  }, [paciente, router]);

  if (!paciente) return null;

  const handleBuscar = (filtros) => {
    setError('');
    setCargando(true);
    setResultados(null);
    buscarTurnos({ ...filtros, pacienteId: paciente.paciente_id })
      .then(setResultados)
      .catch(() => setError('No pudimos conectar con el servidor. Verificá que el backend esté corriendo.'))
      .finally(() => setCargando(false));
  };

  const totalTurnos = resultados?.reduce((acc, d) => acc + d.turnos.length, 0) ?? 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Buscar turno</h1>
        <p className={styles.pageSubtitle}>
          Encontrá turnos disponibles y agregálos a tu preselección.
        </p>
      </header>

      <div className={styles.layout}>
        <aside aria-label="Panel de filtros">
          <FiltrosBusqueda onBuscar={handleBuscar} cargando={cargando} />
        </aside>

        <section aria-label="Resultados de búsqueda" aria-live="polite" className={styles.results}>
          {cargando && (
            <div className={styles.resultsList}>
              <SkeletonDia />
              <SkeletonDia />
            </div>
          )}

          {error && !cargando && (
            <div role="alert" className={styles.errorBox}>
              <p className={styles.errorIcon} aria-hidden="true">⚠️</p>
              <p className={styles.errorTitle}>Error al buscar</p>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          {!cargando && !error && resultados?.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon} aria-hidden="true">🔍</p>
              <h2 className={styles.emptyTitle}>Sin resultados</h2>
              <p className={styles.emptyText}>
                No hay turnos disponibles para los filtros seleccionados.<br />
                Probá con otras fechas, especialidad o sede.
              </p>
            </div>
          )}

          {!cargando && !error && resultados?.length > 0 && (
            <div className={styles.resultsList}>
              <p className={styles.resultCount}>
                <strong>{totalTurnos}</strong>{' '}
                {totalTurnos === 1 ? 'turno disponible' : 'turnos disponibles'}
              </p>
              {resultados.map((dia) => (
                <ResultadosDia key={dia.fecha} dia={dia} />
              ))}
            </div>
          )}

          {!cargando && !error && resultados === null && (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon} aria-hidden="true">🩺</p>
              <h2 className={styles.emptyTitle}>Buscá tu turno</h2>
              <p className={styles.emptyText}>
                Usá los filtros para encontrar el turno que necesitás.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
