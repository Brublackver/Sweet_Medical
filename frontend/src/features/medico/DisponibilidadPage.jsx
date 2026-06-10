import { useState, useEffect }  from 'react';
import { useNavigate }          from 'react-router-dom';
import { useMedico }            from '@/context/MedicoContext';
import { formatearFechaConAnio } from '@/lib/fecha';
import { getDisponibilidad, definirDisponibilidad, eliminarDisponibilidad } from '@/lib/api';
import styles from './Medico.module.css';

export default function DisponibilidadPage() {
  const { medico }                     = useMedico();
  const navigate                       = useNavigate();
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [cargando,  setCargando]       = useState(true);
  const [error,     setError]          = useState('');
  const [guardando, setGuardando]      = useState(false);
  const [errorForm, setErrorForm]      = useState('');

  const [fecha,     setFecha]          = useState('');
  const [horaDesde, setHoraDesde]      = useState('');
  const [horaHasta, setHoraHasta]      = useState('');

  useEffect(() => {
    if (medico === null) { navigate('/login', { replace: true }); return; }
    if (!medico) return;
    getDisponibilidad(medico.medico_id)
      .then(setDisponibilidades)
      .catch(() => setError('No pudimos cargar la disponibilidad.'))
      .finally(() => setCargando(false));
  }, [medico, navigate]);

  if (!medico) return null;

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

      {!cargando && !error && disponibilidades.length === 0 && (
        <div className={styles.emptyCard}>
          <p className={styles.emptyCardIcon} aria-hidden="true">🗓</p>
          <p className={styles.emptyCardText}>No tenés disponibilidad cargada todavía.</p>
        </div>
      )}

      {!cargando && disponibilidades.length > 0 && (
        <div className={styles.dispLista}>
          {disponibilidades
            .slice()
            .sort((a, b) => a.fecha.localeCompare(b.fecha))
            .map((d) => (
              <div key={d.disponibilidad_id ?? d.id} className={styles.dispItem}>
                <div>
                  <p className={styles.dispFecha}>{formatearFechaConAnio(d.fecha)}</p>
                  <p className={styles.dispHoras}>{d.horaDesde} hs — {d.horaHasta} hs</p>
                </div>
                <button
                  onClick={() => handleEliminar(d.disponibilidad_id ?? d.id)}
                  aria-label={`Eliminar disponibilidad del ${d.fecha}`}
                  className={styles.eliminarBtn}
                >
                  Eliminar
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
