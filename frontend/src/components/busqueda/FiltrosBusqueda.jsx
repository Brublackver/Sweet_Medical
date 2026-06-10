import { useState } from 'react';
import styles from './Busqueda.module.css';

const hoy = () => new Date().toISOString().split('T')[0];
const en30Dias = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

const initialState = () => ({
  especialidad: '',
  practica:     '',
  sede:         '',
  medicoId:     '',
  fechaDesde:   hoy(),
  fechaHasta:   en30Dias(),
  direccion:    'asc',
});

export default function FiltrosBusqueda({ onBuscar, cargando }) {
  const [filtros, setFiltros] = useState(initialState);

  const set = (campo) => (e) =>
    setFiltros((prev) => ({ ...prev, [campo]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v !== '')
    );
    onBuscar(params);
  };

  const handleReset = () => setFiltros(initialState);

  return (
    <form onSubmit={handleSubmit} aria-label="Filtros de búsqueda" className={styles.filtrosForm}>
      <h2 className={styles.filtrosTitle}>Filtros</h2>

      <div className={styles.filtrosFields}>
        <Campo id="especialidad" label="Especialidad" placeholder="Ej: Cardiología"        value={filtros.especialidad} onChange={set('especialidad')} />
        <Campo id="practica"     label="Práctica"     placeholder="Ej: Electrocardiograma" value={filtros.practica}     onChange={set('practica')} />
        <Campo id="sede"         label="Sede"         placeholder="Ej: Sede Centro"         value={filtros.sede}         onChange={set('sede')} />
        <Campo id="medicoId"     label="ID Médico"    placeholder="Opcional"                value={filtros.medicoId}     onChange={set('medicoId')} type="number" />

        <div className={styles.campo}>
          <label htmlFor="fechaDesde" className={styles.campoLabel}>Desde</label>
          <input id="fechaDesde" type="date" value={filtros.fechaDesde} onChange={set('fechaDesde')} className={styles.campoInput} />
        </div>

        <div className={styles.campo}>
          <label htmlFor="fechaHasta" className={styles.campoLabel}>Hasta</label>
          <input id="fechaHasta" type="date" value={filtros.fechaHasta} onChange={set('fechaHasta')} className={styles.campoInput} />
        </div>

        <div className={styles.campo}>
          <label htmlFor="direccion" className={styles.campoLabel}>Ordenar</label>
          <select id="direccion" value={filtros.direccion} onChange={set('direccion')} className={styles.campoSelect}>
            <option value="asc">Fecha más cercana primero</option>
            <option value="desc">Fecha más lejana primero</option>
          </select>
        </div>
      </div>

      <div className={styles.filtrosBtns}>
        <button type="submit" disabled={cargando} className={styles.buscarBtn}>
          {cargando ? (
            <>
              <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className={styles.spinnerCircle} />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className={styles.spinnerPath} />
              </svg>
              Buscando...
            </>
          ) : 'Buscar turnos'}
        </button>
        <button type="button" onClick={handleReset} className={styles.limpiarBtn}>
          Limpiar filtros
        </button>
      </div>
    </form>
  );
}

function Campo({ id, label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.campoLabel}>{label}</label>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} className={styles.campoInput} />
    </div>
  );
}
