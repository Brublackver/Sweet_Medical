import { useState, useEffect } from 'react';
import { getAllSedes, getAllMedicos } from '@/lib/api';
import styles from '@/features/busqueda/Busqueda.module.css';

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
  const [filtros, setFiltros]       = useState(initialState);
  const [sedes, setSedes]           = useState([]);
  const [medicos, setMedicos]       = useState([]);
  const [minimizado, setMinimizado] = useState(false);

  // Poblamos los selectores con datos reales del backend (GetAll).
  // Si falla la carga, los selectores quedan solo con la opción "Todas/Todos".
  useEffect(() => {
    getAllSedes().then(setSedes).catch(() => {});
    getAllMedicos().then(setMedicos).catch(() => {});
  }, []);

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
      <div className={styles.filtrosHeader}>
        <h2 className={styles.filtrosTitle}>Filtros</h2>
        <button
          type="button"
          className={styles.filtrosToggle}
          onClick={() => setMinimizado((p) => !p)}
          aria-expanded={!minimizado}
          aria-label={minimizado ? 'Expandir filtros' : 'Minimizar filtros'}
        >
          <span className={`${styles.filtrosChevron} ${minimizado ? '' : styles.filtrosChevronOpen}`}>›</span>
        </button>
      </div>

      <div className={`${styles.filtrosCuerpo} ${minimizado ? styles.filtrosCuerpoCollapsed : ''}`}>
        <div className={styles.filtrosCuerpoInner}>
      <div className={styles.filtrosFields}>
        <Campo id="especialidad" label="Especialidad" placeholder="Ej: Cardiología"        value={filtros.especialidad} onChange={set('especialidad')} />
        <Campo id="practica"     label="Práctica"     placeholder="Ej: Electrocardiograma" value={filtros.practica}     onChange={set('practica')} />
        <div className={styles.campo}>
          <label htmlFor="sede" className={styles.campoLabel}>Sede</label>
          <select id="sede" value={filtros.sede} onChange={set('sede')} className={styles.campoSelect}>
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.sede_id} value={s.nombre}>{s.nombre}</option>
            ))}
          </select>
        </div>

        <div className={styles.campo}>
          <label htmlFor="medicoId" className={styles.campoLabel}>Médico</label>
          <select id="medicoId" value={filtros.medicoId} onChange={set('medicoId')} className={styles.campoSelect}>
            <option value="">Todos los médicos</option>
            {medicos.map((m) => (
              <option key={m.medico_id} value={m.medico_id}>{m.nombre}</option>
            ))}
          </select>
        </div>

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
        </div>
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
