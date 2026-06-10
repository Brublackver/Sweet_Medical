import styles from '@/features/admin/AdminPage.module.css';

export default function CoberturaEditor({ titulo, tipo, items, form, onFormChange, onAgregar, onQuitar, valida }) {
  const labelCodigo = tipo === 'especialidad' ? 'Cód. especialidad' : 'Cód. práctica';
  return (
    <div className={styles.seccionEsp}>
      <h3 className={styles.seccionEspTitulo}>{titulo} <span className={styles.opcional}>(opcional)</span></h3>

      {items.length > 0 && (
        <ul className={styles.espLista}>
          {items.map((item, idx) => {
            const codigo = tipo === 'especialidad' ? item.especialidad.codigo : item.practica.codigo;
            return (
              <li key={idx} className={styles.espItem}>
                <div className={styles.espInfo}>
                  <span className={styles.espNombre}>{codigo}</span>
                  <span className={styles.espDetalle}>{item.nivel}% de cobertura</span>
                </div>
                <button type="button" onClick={() => onQuitar(idx)} className={styles.espQuitar}>✕</button>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.cobFormGrid}>
        <div className={styles.campo}>
          <label className={styles.labelSm}>{labelCodigo}</label>
          <input type="text" maxLength={20} value={form.codigo} placeholder="Ej: CARD" className={styles.input}
            onChange={(e) => onFormChange('codigo', e.target.value)} />
        </div>
        <div className={styles.campo}>
          <label className={styles.labelSm}>Nivel (0–100%)</label>
          <input type="number" min="0" max="100" value={form.nivel} placeholder="80" className={styles.input}
            onChange={(e) => onFormChange('nivel', e.target.value)} />
        </div>
      </div>
      <button type="button" onClick={onAgregar} disabled={!valida} className={styles.agregarBtn}>
        + Agregar cobertura
      </button>
    </div>
  );
}
