'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { crearAvisoDisponibilidad } from '@/lib/api';
import styles from '@/features/busqueda/Busqueda.module.css';

/*
  AvisoDisponibilidad — la "fila de espera" desde la búsqueda.

  Aparece SOLO cuando una búsqueda no devolvió turnos. Guarda exactamente los
  filtros que se usaron, así el backend puede volver a evaluarlos cuando alguien
  cancele un turno o un médico abra agenda nueva.

  El backend es idempotente: pedir dos veces el mismo aviso devuelve el que ya
  existía en vez de duplicarlo. Por eso acá no hace falta chequear nada antes.
*/
export default function AvisoDisponibilidad({ pacienteId, filtros }) {
  const [estado, setEstado] = useState('inicial'); // inicial | enviando | listo | error
  const [error, setError]   = useState('');

  // Si el paciente vuelve a buscar con otros filtros, este aviso ya no es el
  // mismo: se resetea para que pueda suscribirse a la búsqueda nueva.
  useEffect(() => {
    setEstado('inicial');
    setError('');
  }, [filtros]);

  const handleAvisar = () => {
    setEstado('enviando');
    setError('');

    // Solo los criterios de búsqueda. `direccion` es orden de presentación,
    // no un filtro: no define qué turno sirve, así que no viaja.
    const criterios = {
      especialidad: filtros.especialidad || null,
      practica:     filtros.practica     || null,
      sede:         filtros.sede         || null,
      medicoId:     filtros.medicoId     || null,
      obraSocial:   filtros.obraSocial   || null,
      fechaDesde:   filtros.fechaDesde   || null,
      fechaHasta:   filtros.fechaHasta   || null,
    };

    crearAvisoDisponibilidad(pacienteId, criterios)
      .then(() => setEstado('listo'))
      .catch((e) => {
        setError(e.response?.data?.message || 'No pudimos registrar el aviso. Probá de nuevo.');
        setEstado('error');
      });
  };

  if (estado === 'listo') {
    return (
      <div className={styles.avisoBox} role="status">
        <p className={styles.avisoIcon} aria-hidden="true">✅</p>
        <p className={styles.avisoTitle}>Te vamos a avisar</p>
        <p className={styles.avisoText}>
          Cuando se libere un turno con estos filtros te llega una notificación.
        </p>
        <Link href="/avisos" className={styles.avisoLink}>
          Ver mis avisos
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.avisoBox}>
      <p className={styles.avisoIcon} aria-hidden="true">🔔</p>
      <p className={styles.avisoTitle}>¿Querés que te avisemos?</p>
      <p className={styles.avisoText}>
        Te notificamos apenas aparezca un turno que coincida con esta búsqueda.
      </p>

      {error && <p role="alert" className={styles.avisoError}>⚠️ {error}</p>}

      <button
        type="button"
        onClick={handleAvisar}
        disabled={estado === 'enviando'}
        className={styles.avisoBtn}
      >
        {estado === 'enviando' ? 'Registrando...' : 'Avisarme cuando se libere un turno'}
      </button>
    </div>
  );
}
