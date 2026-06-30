'use client';
import { useState, useEffect }  from 'react';
import { useRouter }            from 'next/navigation';
import { useMedico }            from '@/context/MedicoContext';
import ListaPaginada            from '@/components/ui/ListaPaginada';
import Tabs                     from '@/components/ui/Tabs';
import Icono                    from '@/components/ui/Icono';
import { formatearFechaConAnio } from '@/lib/fecha';
import { getMedico, getTurnosMedico, definirDisponibilidad, eliminarDisponibilidad } from '@/lib/api';
import styles from './Medico.module.css';

const ESTADO_LABEL = {
  reservado:        { texto: '● Reservado',        clase: 'estadoReservado' },
  cancelado:        { texto: '✕ Cancelado',         clase: 'estadoCancelado' },
  realizado:        { texto: '✓ Realizado',         clase: 'estadoRealizado' },
  pendiente_cambio: { texto: '⟳ Cambio pendiente',  clase: 'estadoPendienteCambio' },
  propuesta_medico: { texto: '⟳ Propuesta enviada', clase: 'estadoPropuestaMedico' },
};

export default function DisponibilidadPage() {
  const { medico, cargado }     = useMedico();
  const router                  = useRouter();
  const [tab, setTab]           = useState('proximas');

  const [disponibilidades, setDisponibilidades] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [fecha,     setFecha]     = useState('');
  const [horaDesde, setHoraDesde] = useState('');
  const [horaHasta, setHoraHasta] = useState('');

  // Turnos del médico — se cargan solo cuando abre la pestaña Historial
  const [turnos,          setTurnos]          = useState([]);
  const [cargandoTurnos,  setCargandoTurnos]  = useState(false);
  const [turnosCargados,  setTurnosCargados]  = useState(false);
  const [diasExpandidos,  setDiasExpandidos]  = useState({});

  useEffect(() => {
    if (!cargado) return;
    if (medico === null) { router.replace('/login'); return; }
    getMedico(medico.medico_id)
      .then((m) => setDisponibilidades(m.disponibilidades ?? []))
      .catch(() => setError('No pudimos cargar la disponibilidad.'))
      .finally(() => setCargando(false));
  }, [medico, cargado, router]);

  useEffect(() => {
    if (tab !== 'historial' || turnosCargados || !medico) return;
    setCargandoTurnos(true);
    getTurnosMedico(medico.medico_id)
      .then((data) => { setTurnos(data); setTurnosCargados(true); })
      .catch(() => setTurnos([]))
      .finally(() => setCargandoTurnos(false));
  }, [tab, turnosCargados, medico]);

  if (!cargado || !medico) return null;

  const d   = new Date();
  const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const futuras = disponibilidades
    .filter((x) => x.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const pasadas = disponibilidades
    .filter((x) => x.fecha < hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const handleAgregar = (e) => {
    e.preventDefault();
    setErrorForm('');
    if (!fecha || !horaDesde || !horaHasta) { setErrorForm('Completá todos los campos.'); return; }
    if (horaDesde >= horaHasta) { setErrorForm('La hora de inicio debe ser anterior a la hora de fin.'); return; }
    setGuardando(true);
    definirDisponibilidad(medico.medico_id, { fecha, horaDesde, horaHasta })
      .then((data) => {
        setDisponibilidades(data);
        setFecha(''); setHoraDesde(''); setHoraHasta('');
      })
      .catch((e) => setErrorForm(e.response?.data?.message ?? 'Error al guardar.'))
      .finally(() => setGuardando(false));
  };

  const handleEliminar = (disponibilidadId) => {
    eliminarDisponibilidad(medico.medico_id, disponibilidadId)
      .then(() => setDisponibilidades((prev) => prev.filter((d) => d.disponibilidad_id !== disponibilidadId)))
      .catch(() => setError('No se pudo eliminar la disponibilidad.'));
  };

  const toggleDia = (fecha) =>
    setDiasExpandidos((prev) => ({ ...prev, [fecha]: !prev[fecha] }));

  const turnosDeFecha = (fecha) =>
    turnos.filter((t) => t.fecha === fecha)
          .sort((a, b) => a.hora.localeCompare(b.hora));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Mi disponibilidad</h1>
        <p className={styles.pageSubtitle}>
          Configurá los días y horarios en que podés atender pacientes.
        </p>
      </header>

      {/* ── Formulario de carga ─────────────────────────────────────────── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Agregar disponibilidad</h2>
        <form onSubmit={handleAgregar}>
          <div className={styles.formGrid}>
            <div>
              <label htmlFor="disp-fecha" className={styles.campoLabel}>Fecha</label>
              <input
                id="disp-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={styles.input}
              />
            </div>
            <div>
              <label htmlFor="disp-desde" className={styles.campoLabel}>Hora desde</label>
              <input
                id="disp-desde"
                type="time"
                value={horaDesde}
                onChange={(e) => setHoraDesde(e.target.value)}
                className={styles.input}
              />
            </div>
            <div>
              <label htmlFor="disp-hasta" className={styles.campoLabel}>Hora hasta</label>
              <input
                id="disp-hasta"
                type="time"
                value={horaHasta}
                onChange={(e) => setHoraHasta(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {errorForm && (
            <p role="alert" className={styles.errorForm}>⚠️ {errorForm}</p>
          )}

          <button type="submit" disabled={guardando} className={styles.addBtn}>
            {guardando ? 'Guardando...' : '+ Agregar disponibilidad'}
          </button>
        </form>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs
        items={[
          { key: 'proximas',  label: 'Próximas',              badge: futuras.length },
          { key: 'historial', label: 'Historial de atención', badge: pasadas.length },
        ]}
        value={tab}
        onChange={setTab}
        ariaLabel="Sección de disponibilidad"
      />

      {cargando && <p className={styles.cargandoText}>Cargando...</p>}
      {error    && <p role="alert" className={styles.errorInline}>{error}</p>}

      {/* ── Pestaña: Próximas ────────────────────────────────────────────── */}
      {!cargando && tab === 'proximas' && (
        <>
          {futuras.length === 0 ? (
            <div className={styles.emptyCard}>
              <p className={styles.emptyCardIcon} aria-hidden="true">🗓</p>
              <p className={styles.emptyCardText}>No tenés disponibilidad futura cargada.</p>
            </div>
          ) : (
            <ListaPaginada ariaLabel="Disponibilidades futuras" porPagina={6}>
              {futuras.map((d) => (
                <div key={d.disponibilidad_id ?? d.id} className={styles.dispItem}>
                  <div>
                    <p className={styles.dispFecha}>{formatearFechaConAnio(d.fecha)}</p>
                    <p className={styles.dispHoras}>{d.horaDesde} hs — {d.horaHasta} hs</p>
                  </div>
                  <button
                    onClick={() => handleEliminar(d.disponibilidad_id ?? d.id)}
                    aria-label={`Eliminar disponibilidad del ${d.fecha}`}
                    title="Eliminar disponibilidad"
                    className={styles.eliminarBtn}
                  >
                    <Icono nombre="papelera" tamano={18} />
                  </button>
                </div>
              ))}
            </ListaPaginada>
          )}
        </>
      )}

      {/* ── Pestaña: Historial de atención ──────────────────────────────── */}
      {!cargando && tab === 'historial' && (
        <>
          {pasadas.length === 0 ? (
            <div className={styles.emptyCard}>
              <p className={styles.emptyCardIcon} aria-hidden="true">📋</p>
              <p className={styles.emptyCardText}>Todavía no tenés historial de disponibilidades.</p>
            </div>
          ) : (
            <div className={styles.historialLista}>
              {cargandoTurnos && (
                <p className={styles.cargandoText}>Cargando historial...</p>
              )}
              {pasadas.map((d) => {
                const turnosDia    = turnosCargados ? turnosDeFecha(d.fecha) : [];
                const expandido    = !!diasExpandidos[d.fecha];
                return (
                  <div key={d.disponibilidad_id ?? d.id} className={styles.historialDia}>
                    <button
                      className={styles.historialDiaHeader}
                      onClick={() => toggleDia(d.fecha)}
                      aria-expanded={expandido}
                    >
                      <div className={styles.historialDiaInfo}>
                        <p className={styles.historialDiaFecha}>{formatearFechaConAnio(d.fecha)}</p>
                        <p className={styles.historialDiaHoras}>{d.horaDesde} hs — {d.horaHasta} hs</p>
                      </div>
                      <div className={styles.historialDiaMeta}>
                        {turnosCargados && (
                          <span className={styles.historialDiaBadge}>
                            {turnosDia.length === 0 ? 'Sin turnos' : `${turnosDia.length} turno${turnosDia.length !== 1 ? 's' : ''}`}
                          </span>
                        )}
                        <span className={styles.historialChevron} aria-hidden="true">
                          {expandido ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>

                    {expandido && (
                      <div className={styles.historialDiaTurnos}>
                        {!turnosCargados && (
                          <p className={styles.cargandoText}>Cargando turnos...</p>
                        )}
                        {turnosCargados && turnosDia.length === 0 && (
                          <p className={styles.historialSinTurnos}>Sin turnos registrados para este día.</p>
                        )}
                        {turnosCargados && turnosDia.map((t) => {
                          const estado = ESTADO_LABEL[t.estado] ?? { texto: t.estado, clase: 'estadoDesconocido' };
                          return (
                            <div key={t.turno_id ?? t.turnoId} className={styles.historialTurnoRow}>
                              <span className={styles.historialTurnoHora}>{t.hora} hs</span>
                              <span className={styles.historialTurnoServicio}>
                                {t.snapshotMedico?.especialidades?.[0]?.nombre
                                  ?? t.snapshotMedico?.practicas?.[0]?.nombre
                                  ?? '—'}
                              </span>
                              <span className={styles.historialTurnoPaciente}>
                                {t.snapshotPaciente?.nombre ?? '—'}
                              </span>
                              <span className={`${styles.historialTurnoEstado} ${styles[estado.clase] ?? ''}`}>
                                {estado.texto}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
