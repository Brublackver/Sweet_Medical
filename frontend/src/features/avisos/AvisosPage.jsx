'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter }  from 'next/navigation';
import Link           from 'next/link';
import { usePaciente } from '@/context/PacienteContext';
import { getAvisosDisponibilidad, cancelarAvisoDisponibilidad } from '@/lib/api';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { formatearFechaConAnio } from '@/lib/fecha';
import ListaPaginada  from '@/components/ui/ListaPaginada';
import EstadoCarga    from '@/components/ui/EstadoCarga';
import Tabs           from '@/components/ui/Tabs';
import { SkeletonDia } from '@/components/ui/Skeleton';
import styles from './Avisos.module.css';

/*
  AvisosPage — la fila de espera vista por el paciente.

  Muestra las búsquedas a las que se suscribió y le permite darlas de baja.
  Los avisos ya notificados se conservan (no se borran) para que quede claro
  por qué llegó esa notificación; simplemente dejan de estar "en espera".
*/

const FILTROS = [
  { key: 'ACTIVO',     label: 'En espera' },
  { key: 'NOTIFICADO', label: 'Avisados' },
  { key: 'todos',      label: 'Todos' },
];

const ETIQUETA_ESTADO = {
  ACTIVO:     { texto: 'En espera', clase: 'estadoActivo' },
  NOTIFICADO: { texto: 'Turno encontrado', clase: 'estadoNotificado' },
  CANCELADO:  { texto: 'Cancelado', clase: 'estadoCancelado' },
};

export default function AvisosPage() {
  const { paciente, cargado } = usePaciente();
  const router                = useRouter();
  const [avisos, setAvisos]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState('');
  const [filtro, setFiltro]     = useState('ACTIVO');
  const [procesandoId, setProcesandoId] = useState(null);

  const pacienteId = paciente?.paciente_id ?? null;

  const cargar = useCallback(() => {
    if (!pacienteId) return;
    // Se traen TODOS y se filtra en el cliente: la lista es corta y así cambiar
    // de pestaña no dispara una request nueva.
    getAvisosDisponibilidad(pacienteId)
      .then(setAvisos)
      .catch(() => setError('No pudimos cargar tus avisos. Intentá de nuevo.'))
      .finally(() => setCargando(false));
  }, [pacienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Si el aviso se disparó mientras la pestaña estaba en segundo plano, al
  // volver se refresca el estado.
  useRefetchOnFocus(cargar);

  useEffect(() => {
    if (cargado && paciente === null) router.replace('/login');
  }, [paciente, cargado, router]);

  if (!cargado || !paciente) return null;

  const handleCancelar = (avisoId) => {
    setError('');
    setProcesandoId(avisoId);
    cancelarAvisoDisponibilidad(pacienteId, avisoId)
      .then(() => cargar())
      .catch((e) => setError(e.response?.data?.message || 'No se pudo cancelar el aviso.'))
      .finally(() => setProcesandoId(null));
  };

  const filtrados = avisos.filter((a) => (filtro === 'todos' ? true : a.estado === filtro));

  const rango = (f) => {
    if (!f.fechaDesde && !f.fechaHasta) return 'Cualquier fecha';
    if (f.fechaDesde && f.fechaHasta)
      return `${formatearFechaConAnio(f.fechaDesde)} — ${formatearFechaConAnio(f.fechaHasta)}`;
    return f.fechaDesde
      ? `Desde ${formatearFechaConAnio(f.fechaDesde)}`
      : `Hasta ${formatearFechaConAnio(f.fechaHasta)}`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Avisos de disponibilidad</h1>
        <p className={styles.pageSubtitle}>
          Te notificamos cuando aparezca un turno que coincida con tus búsquedas.
        </p>
      </header>

      <Tabs items={FILTROS} value={filtro} onChange={setFiltro} ariaLabel="Filtrar avisos" />

      {error && <p role="alert" className={styles.errorMsg}>⚠️ {error}</p>}

      <EstadoCarga
        cargando={cargando}
        vacio={filtrados.length === 0}
        slotCargando={<SkeletonDia />}
        slotVacio={
          <div className={styles.emptyState} role="status">
            <p className={styles.emptyIcon} aria-hidden="true">🔔</p>
            <h2 className={styles.emptyTitle}>
              {avisos.length === 0 ? 'No tenés avisos' : 'No hay avisos en esta categoría'}
            </h2>
            <p className={styles.emptyText}>
              {avisos.length === 0
                ? 'Cuando una búsqueda no dé resultados vas a poder pedir que te avisemos.'
                : 'Probá con otro filtro.'}
            </p>
            <Link href="/buscar" className={styles.emptyLink}>Buscar turno</Link>
          </div>
        }
      >
        <ListaPaginada
          items={filtrados}
          getKey={(a) => a.aviso_id}
          porPagina={8}
          ariaLabel="Tus avisos de disponibilidad"
          renderItem={(a) => {
            const etiqueta   = ETIQUETA_ESTADO[a.estado] ?? ETIQUETA_ESTADO.ACTIVO;
            const procesando = procesandoId === a.aviso_id;
            return (
              <article className={styles.aviso}>
                <div className={styles.avisoFila}>
                  <div className={styles.avisoTexto}>
                    <p className={styles.avisoDescripcion}>{a.descripcion}</p>
                    <p className={styles.avisoRango}>📅 {rango(a.filtros)}</p>
                    {a.fechaAviso && (
                      <p className={styles.avisoFecha}>
                        Te avisamos el {formatearFechaConAnio(a.fechaAviso.slice(0, 10))}
                      </p>
                    )}
                  </div>

                  <span className={`${styles.estadoTag} ${styles[etiqueta.clase]}`}>
                    {etiqueta.texto}
                  </span>
                </div>

                {a.estado !== 'CANCELADO' && (
                  <div className={styles.acciones}>
                    {a.estado === 'NOTIFICADO' && (
                      <Link href="/buscar" className={styles.btnBuscar}>Buscar turno</Link>
                    )}
                    <button
                      type="button"
                      className={styles.btnCancelar}
                      disabled={procesando}
                      onClick={() => handleCancelar(a.aviso_id)}
                      aria-label={`Cancelar el aviso de ${a.descripcion}`}
                    >
                      {procesando ? 'Cancelando...' : '✕ Cancelar aviso'}
                    </button>
                  </div>
                )}
              </article>
            );
          }}
        />
      </EstadoCarga>
    </div>
  );
}
