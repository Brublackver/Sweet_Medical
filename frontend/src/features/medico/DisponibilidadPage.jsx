'use client';
import { useState, useEffect }  from 'react';
import { useRouter }            from 'next/navigation';
import { useMedico }            from '@/context/MedicoContext';
import ListaPaginada            from '@/components/ui/ListaPaginada';
import Tabs                     from '@/components/ui/Tabs';
import FormDisponibilidad       from '@/components/medico/FormDisponibilidad';
import ItemDisponibilidad       from '@/components/medico/ItemDisponibilidad';
import HistorialDia             from '@/components/medico/HistorialDia';
import { getMedico, getTurnosMedico, eliminarDisponibilidad } from '@/lib/api';
import styles from './Medico.module.css';

/*
  DisponibilidadPage — orquesta el alta/baja de disponibilidad y el historial.
  La UI vive en componentes dedicados (FormDisponibilidad, ItemDisponibilidad,
  HistorialDia); acá quedan solo la carga de datos y la composición.
*/
export default function DisponibilidadPage() {
  const { medico, cargado }     = useMedico();
  const router                  = useRouter();
  const [tab, setTab]           = useState('proximas');

  const [disponibilidades, setDisponibilidades] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');

  // Turnos del médico — se cargan solo cuando se abre la pestaña Historial.
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

  const handleEliminar = (disponibilidadId) => {
    eliminarDisponibilidad(medico.medico_id, disponibilidadId)
      .then(() => setDisponibilidades((prev) => prev.filter((x) => x.disponibilidad_id !== disponibilidadId)))
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

      <FormDisponibilidad medicoId={medico.medico_id} onGuardada={setDisponibilidades} />

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
        futuras.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyCardIcon} aria-hidden="true">🗓</p>
            <p className={styles.emptyCardText}>No tenés disponibilidad futura cargada.</p>
          </div>
        ) : (
          <ListaPaginada ariaLabel="Disponibilidades futuras" porPagina={6}>
            {futuras.map((disp) => (
              <ItemDisponibilidad
                key={disp.disponibilidad_id ?? disp.id}
                disponibilidad={disp}
                onEliminar={handleEliminar}
              />
            ))}
          </ListaPaginada>
        )
      )}

      {/* ── Pestaña: Historial de atención ──────────────────────────────── */}
      {!cargando && tab === 'historial' && (
        pasadas.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyCardIcon} aria-hidden="true">📋</p>
            <p className={styles.emptyCardText}>Todavía no tenés historial de disponibilidades.</p>
          </div>
        ) : (
          <div className={styles.historialLista}>
            {cargandoTurnos && <p className={styles.cargandoText}>Cargando historial...</p>}
            {pasadas.map((disp) => (
              <HistorialDia
                key={disp.disponibilidad_id ?? disp.id}
                disponibilidad={disp}
                turnos={turnosCargados ? turnosDeFecha(disp.fecha) : []}
                turnosCargados={turnosCargados}
                expandido={!!diasExpandidos[disp.fecha]}
                onToggle={() => toggleDia(disp.fecha)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
