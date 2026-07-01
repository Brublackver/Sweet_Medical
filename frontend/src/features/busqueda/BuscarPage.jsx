'use client';
import { useState, useEffect } from 'react';
import { useRouter }      from 'next/navigation';
import { usePaciente }    from '@/context/PacienteContext';
import { buscarTurnos }   from '@/lib/api';
import { hoyISO, enNDiasISO, esTurnoReservable } from '@/lib/fecha';
import FiltrosBusqueda    from '@/components/busqueda/FiltrosBusqueda';
import CarruselDias       from '@/components/busqueda/CarruselDias';
import ResultadosDia      from '@/components/busqueda/ResultadosDia';
import EstadoCarga        from '@/components/ui/EstadoCarga';
import { SkeletonDia }    from '@/components/ui/Skeleton';
import styles from './Busqueda.module.css';

const hoy      = () => hoyISO();
const en30Dias = () => enNDiasISO(30);

// Filtro de seguridad: descarta turnos cuyo horario ya venció y días que quedaron
// sin turnos disponibles. El backend ya no los devuelve, pero si la página quedó
// abierta este filtro evita mostrar horarios pasados al re-renderizar.
const descartarVencidos = (dias) =>
  dias
    .map((d) => ({ ...d, turnos: d.turnos.filter((t) => esTurnoReservable(d.fecha, t.hora)) }))
    .filter((d) => d.turnos.length > 0);

export default function BuscarPage() {
  const { paciente, cargado }               = usePaciente();
  const router                              = useRouter();
  const [resultados, setResultados]         = useState(null);   // [{ fecha, turnos[] }]
  const [cargando,   setCargando]           = useState(false);
  const [error,      setError]              = useState('');
  const [filtrosActivos, setFiltrosActivos] = useState(null);   // { fechaDesde, fechaHasta }
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // "YYYY-MM-DD"

  useEffect(() => {
    if (cargado && paciente === null) router.replace('/login');
  }, [paciente, cargado, router]);

  if (!cargado || !paciente) return null;

  const handleBuscar = (filtros) => {
    setError('');
    setCargando(true);
    setResultados(null);

    const fechaDesde = filtros.fechaDesde || hoy();
    const fechaHasta = filtros.fechaHasta || en30Dias();

    setFiltrosActivos({ fechaDesde, fechaHasta });
    setDiaSeleccionado(null);

    buscarTurnos({ ...filtros, pacienteId: paciente.paciente_id })
      .then((data) => {
        const vigentes = descartarVencidos(data);
        setResultados(vigentes);
        const primerDia = vigentes.find((d) => d.turnos.length > 0)?.fecha ?? fechaDesde;
        setDiaSeleccionado(primerDia);
      })
      .catch(() => setError('No pudimos conectar con el servidor. Verificá que el backend esté corriendo.'))
      .finally(() => setCargando(false));
  };

  // Mapa { "YYYY-MM-DD": cantidad } para el carrusel
  const turnosPorDia = resultados
    ? Object.fromEntries(resultados.map((d) => [d.fecha, d.turnos.length]))
    : {};

  // Día activo: busca en resultados o crea un stub vacío para mostrar el empty state
  const diaActual = resultados?.find((d) => d.fecha === diaSeleccionado)
    ?? (diaSeleccionado ? { fecha: diaSeleccionado, turnos: [] } : null);

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
          <EstadoCarga
            cargando={cargando}
            error={error}
            vacio={Array.isArray(resultados) && resultados.length === 0}
            slotCargando={<SkeletonDia />}
            slotError={
              <div role="alert" className={styles.errorBox}>
                <p className={styles.errorIcon} aria-hidden="true">⚠️</p>
                <p className={styles.errorTitle}>Error al buscar</p>
                <p className={styles.errorText}>{error}</p>
              </div>
            }
            slotVacio={
              <div className={styles.emptyState}>
                <p className={styles.emptyIcon} aria-hidden="true">🔍</p>
                <h2 className={styles.emptyTitle}>Sin resultados</h2>
                <p className={styles.emptyText}>
                  No se encontraron turnos con estos filtros.<br />
                  Probá con otras fechas, especialidad o sede.
                </p>
              </div>
            }
          >
            {resultados === null ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyIcon} aria-hidden="true">🩺</p>
                <h2 className={styles.emptyTitle}>Buscá tu turno</h2>
                <p className={styles.emptyText}>
                  Usá los filtros para encontrar el turno que necesitás.
                </p>
              </div>
            ) : (
              <div className={styles.resultsList}>
                {filtrosActivos && (
                  <CarruselDias
                    fechaDesde={filtrosActivos.fechaDesde}
                    fechaHasta={filtrosActivos.fechaHasta}
                    turnosPorDia={turnosPorDia}
                    diaSeleccionado={diaSeleccionado}
                    onSeleccionar={setDiaSeleccionado}
                  />
                )}

                {diaActual && <ResultadosDia dia={diaActual} />}
              </div>
            )}
          </EstadoCarga>
        </section>
      </div>
    </div>
  );
}
