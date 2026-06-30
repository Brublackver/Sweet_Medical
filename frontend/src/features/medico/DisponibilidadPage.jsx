'use client';
import { useState, useEffect }  from 'react';
import { useRouter }            from 'next/navigation';
import { useMedico }            from '@/context/MedicoContext';
import ListaPaginada            from '@/components/ui/ListaPaginada';
import Icono                    from '@/components/ui/Icono';
import { formatearFechaConAnio } from '@/lib/fecha';
import { getMedico, definirDisponibilidad, eliminarDisponibilidad } from '@/lib/api';
import styles from './Medico.module.css';

export default function DisponibilidadPage() {
  const { medico, cargado }            = useMedico();
  const router                         = useRouter();
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [cargando,  setCargando]       = useState(true);
  const [error,     setError]          = useState('');
  const [guardando, setGuardando]      = useState(false);
  const [errorForm, setErrorForm]      = useState('');

  const [fecha,           setFecha]          = useState('');
  const [horaDesde,       setHoraDesde]      = useState('');
  const [horaHasta,       setHoraHasta]      = useState('');
  const [historialAbierto, setHistorialAbierto] = useState(false);

  useEffect(() => {
    if (!cargado) return;
    if (medico === null) { router.replace('/login'); return; }
    // Usamos getMedico porque su campo `disponibilidades` es un array CON
    // disponibilidad_id (igual que devuelve el POST al crear una). El endpoint
    // GET /disponibilidad devuelve un objeto indexado por fecha y sin id, que
    // no sirve para listar ni para eliminar.
    getMedico(medico.medico_id)
      .then((m) => setDisponibilidades(m.disponibilidades ?? []))
      .catch(() => setError('No pudimos cargar la disponibilidad.'))
      .finally(() => setCargando(false));
  }, [medico, cargado, router]);

  if (!cargado || !medico) return null;

  // "Hoy" en hora local (YYYY-MM-DD), para comparar con las fechas de las
  // disponibilidades (también strings YYYY-MM-DD → comparación lexicográfica ok).
  const d = new Date();
  const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Futuras (de hoy en adelante) → editables. Pasadas → historial de solo lectura.
  const futuras = disponibilidades
    .filter((x) => x.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const pasadas = disponibilidades
    .filter((x) => x.fecha < hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha)); // más reciente primero

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Mi disponibilidad</h1>
        <p className={styles.pageSubtitle}>
          Configurá los días y horarios en que podés atender pacientes.
        </p>
      </header>

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

      <h2 className={styles.subTitle}>Disponibilidad actual</h2>

      {cargando && <p className={styles.cargandoText}>Cargando...</p>}

      {error && <p role="alert" className={styles.errorInline}>{error}</p>}

      {!cargando && !error && futuras.length === 0 && (
        <div className={styles.emptyCard}>
          <p className={styles.emptyCardIcon} aria-hidden="true">🗓</p>
          <p className={styles.emptyCardText}>No tenés disponibilidad futura cargada.</p>
        </div>
      )}

      {!cargando && futuras.length > 0 && (
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

      {/* Historial: disponibilidades cuya fecha ya pasó. Colapsado por defecto. */}
      {!cargando && pasadas.length > 0 && (
        <div className={styles.historialSection}>
          <button
            onClick={() => setHistorialAbierto((prev) => !prev)}
            aria-expanded={historialAbierto}
            className={styles.historialToggle}
          >
            <span className={styles.historialToggleLabel}>
              🗂 Historial de disponibilidades
            </span>
            <span className={styles.historialBadge}>{pasadas.length}</span>
            <span className={styles.historialChevron} aria-hidden="true">
              {historialAbierto ? '▲' : '▼'}
            </span>
          </button>

          {historialAbierto && (
            <div className={styles.historialLista}>
              <ListaPaginada ariaLabel="Historial de disponibilidades pasadas" porPagina={6}>
                {pasadas.map((d) => (
                  <div key={d.disponibilidad_id ?? d.id} className={`${styles.dispItem} ${styles.dispItemPasada}`}>
                    <div>
                      <p className={styles.dispFecha}>{formatearFechaConAnio(d.fecha)}</p>
                      <p className={styles.dispHoras}>{d.horaDesde} hs — {d.horaHasta} hs</p>
                    </div>
                    <span className={styles.dispBadgePasada}>Finalizada</span>
                  </div>
                ))}
              </ListaPaginada>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
