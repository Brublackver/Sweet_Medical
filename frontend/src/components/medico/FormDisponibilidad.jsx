'use client';
import { useState } from 'react';
import { definirDisponibilidad } from '@/lib/api';
import styles from '@/features/medico/Medico.module.css';

/*
  FormDisponibilidad — formulario de carga de un nuevo tramo de disponibilidad.
  Encapsula su propio estado de formulario y validación. Al guardar con éxito
  notifica al padre con la lista actualizada de disponibilidades vía onGuardada.
*/
export default function FormDisponibilidad({ medicoId, onGuardada }) {
  const [fecha,     setFecha]     = useState('');
  const [horaDesde, setHoraDesde] = useState('');
  const [horaHasta, setHoraHasta] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorForm('');
    if (!fecha || !horaDesde || !horaHasta) { setErrorForm('Completá todos los campos.'); return; }
    if (horaDesde >= horaHasta) { setErrorForm('La hora de inicio debe ser anterior a la hora de fin.'); return; }
    setGuardando(true);
    definirDisponibilidad(medicoId, { fecha, horaDesde, horaHasta })
      .then((data) => {
        onGuardada(data);
        setFecha(''); setHoraDesde(''); setHoraHasta('');
      })
      .catch((err) => setErrorForm(err.response?.data?.message ?? 'Error al guardar.'))
      .finally(() => setGuardando(false));
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Agregar disponibilidad</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div>
            <label htmlFor="disp-fecha" className={styles.campoLabel}>Fecha</label>
            <input id="disp-fecha" type="date" value={fecha}
              onChange={(e) => setFecha(e.target.value)} className={styles.input} />
          </div>
          <div>
            <label htmlFor="disp-desde" className={styles.campoLabel}>Hora desde</label>
            <input id="disp-desde" type="time" value={horaDesde}
              onChange={(e) => setHoraDesde(e.target.value)} className={styles.input} />
          </div>
          <div>
            <label htmlFor="disp-hasta" className={styles.campoLabel}>Hora hasta</label>
            <input id="disp-hasta" type="time" value={horaHasta}
              onChange={(e) => setHoraHasta(e.target.value)} className={styles.input} />
          </div>
        </div>

        {errorForm && <p role="alert" className={styles.errorForm}>⚠️ {errorForm}</p>}

        <button type="submit" disabled={guardando} className={styles.addBtn}>
          {guardando ? 'Guardando...' : '+ Agregar disponibilidad'}
        </button>
      </form>
    </div>
  );
}
