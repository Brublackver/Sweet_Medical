import styles from '@/features/admin/AdminPage.module.css';

export default function EspecialidadesEditor({ especialidades, espForm, onFormChange, onAgregar, onQuitar, espValida }) {
  return (
    <div className={styles.seccionEsp}>
      <h3 className={styles.seccionEspTitulo}>Especialidades</h3>

      {especialidades.length > 0 && (
        <ul className={styles.espLista}>
          {especialidades.map((esp, idx) => (
            <li key={idx} className={styles.espItem}>
              <div className={styles.espInfo}>
                <span className={styles.espNombre}>{esp.nombre}</span>
                <span className={styles.espDetalle}>{esp.codigo} · {esp.duracionTurnoEnMins} min · ${esp.costo}</span>
              </div>
              <button type="button" onClick={() => onQuitar(idx)} className={styles.espQuitar} aria-label={`Quitar ${esp.nombre}`}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.espFormGrid}>
        <div className={styles.campo}>
          <label className={styles.labelSm}>Código</label>
          <input type="text" maxLength={20} value={espForm.codigo} placeholder="Ej: CARD" className={styles.input}
            onChange={(e) => onFormChange('codigo', e.target.value)} />
        </div>
        <div className={styles.campo}>
          <label className={styles.labelSm}>Nombre</label>
          <input type="text" maxLength={100} value={espForm.nombre} placeholder="Ej: Cardiología" className={styles.input}
            onChange={(e) => onFormChange('nombre', e.target.value)} />
        </div>
        <div className={styles.campo}>
          <label className={styles.labelSm}>Duración (min)</label>
          <input type="number" min="1" value={espForm.duracionTurnoEnMins} placeholder="30" className={styles.input}
            onChange={(e) => onFormChange('duracionTurnoEnMins', e.target.value)} />
        </div>
        <div className={styles.campo}>
          <label className={styles.labelSm}>Costo ($)</label>
          <input type="number" min="0" step="0.01" value={espForm.costo} placeholder="5000" className={styles.input}
            onChange={(e) => onFormChange('costo', e.target.value)} />
        </div>
      </div>
      <button type="button" onClick={onAgregar} disabled={!espValida} className={styles.agregarBtn}>
        + Agregar especialidad
      </button>
    </div>
  );
}
