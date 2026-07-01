'use client';
import { useState } from 'react';
import GrupoHora    from './GrupoHora';
import ListaPaginada from '@/components/ui/ListaPaginada';
import styles from '@/features/busqueda/Busqueda.module.css';

function agruparPorHora(turnos) {
  const grupos = {};
  for (const turno of turnos) {
    if (!grupos[turno.hora]) grupos[turno.hora] = [];
    grupos[turno.hora].push(turno);
  }
  return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
}

export default function ResultadosDia({ dia }) {
  const [grupoAbierto, setGrupoAbierto] = useState(0);

  if (!dia || dia.turnos.length === 0) {
    return (
      <div className={styles.emptyDay}>
        <p className={styles.emptyDayIcon} aria-hidden="true">📅</p>
        <p className={styles.emptyDayText}>No hay turnos disponibles para este día.</p>
      </div>
    );
  }

  const grupos = agruparPorHora(dia.turnos);

  return (
    <ListaPaginada
      ariaLabel="Turnos agrupados por hora"
      variante="lista"
      porPagina={4}
    >
      {grupos.map(([hora, turnos], i) => (
        <GrupoHora
          key={hora}
          hora={hora}
          turnos={turnos}
          fecha={dia.fecha}
          expandido={grupoAbierto === i}
          onToggle={() => setGrupoAbierto((prev) => prev === i ? -1 : i)}
        />
      ))}
    </ListaPaginada>
  );
}
