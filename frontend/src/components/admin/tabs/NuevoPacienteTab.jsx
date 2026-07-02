import { useState, useEffect } from 'react';
import { crearPaciente, getAllObrasSociales } from '@/lib/api';
import styles from '@/features/admin/AdminPage.module.css';

const PACIENTE_VACIO = { usuario: '', dni: '', nombre: '' };

export default function NuevoPacienteTab() {
  const [pacienteForm, setPacienteForm]     = useState(PACIENTE_VACIO);
  const [obrasSociales, setObrasSociales]   = useState([]);
  const [obraSocialNombre, setObraSocialNombre] = useState('');
  const [planNombre, setPlanNombre]         = useState('');
  const [cargando, setCargando]             = useState(false);
  const [resultado, setResultado]           = useState(null);
  const [error, setError]                   = useState('');

  // Catálogo de obras sociales (datos maestros). El admin elige de acá:
  // no inventa la obra social ni la cobertura, las trae del catálogo.
  useEffect(() => {
    getAllObrasSociales()
      .then(setObrasSociales)
      .catch(() => setError('No se pudo cargar el catálogo de obras sociales.'));
  }, []);

  // Derivados: la obra social y el plan elegidos salen del catálogo, no de
  // estados duplicados. Una sola fuente de verdad.
  const obraSocialSel = obrasSociales.find((o) => o.nombre === obraSocialNombre) || null;
  const planSel       = obraSocialSel?.planes.find((p) => p.nombre === planNombre) || null;

  const handleObraSocial = (e) => {
    setObraSocialNombre(e.target.value);
    setPlanNombre('');           // al cambiar de obra social, el plan anterior ya no aplica
    setError('');
  };

  const handleCrearPaciente = (e) => {
    e.preventDefault();
    if (!planSel) { setError('Elegí una obra social y un plan.'); return; }
    setError('');
    setResultado(null);
    setCargando(true);
    // El plan se copia tal cual del catálogo (snapshot): el paciente queda con
    // la cobertura canónica, y el cálculo de monto del turno no cambia.
    const payload = {
      usuario:    pacienteForm.usuario,
      dni:        pacienteForm.dni,
      nombre:     pacienteForm.nombre,
      obraSocial: obraSocialSel.nombre,
      plan: {
        nombre:           planSel.nombre,
        coberturaGeneral: planSel.coberturaGeneral,
      },
    };
    crearPaciente(payload)
      .then((data) => {
        setResultado(data);
        setPacienteForm(PACIENTE_VACIO);
        setObraSocialNombre('');
        setPlanNombre('');
      })
      .catch((err) => setError(err.response?.data?.message || err.response?.data?.error || 'Error al crear el paciente.'))
      .finally(() => setCargando(false));
  };

  const formCompleto = pacienteForm.usuario.trim() && pacienteForm.dni.trim() &&
    pacienteForm.nombre.trim() && obraSocialSel && planSel;

  return (
    <form onSubmit={handleCrearPaciente} noValidate className={styles.form}>
      <h2 className={styles.formTitulo}>Registrar Paciente</h2>

      {resultado && (
        <div className={styles.exito}>
          <span>✅</span>
          <span>Paciente creado exitosamente. ID: {resultado.paciente_id}</span>
        </div>
      )}
      {error && <div className={styles.error}><span>⚠️</span><span>{error}</span></div>}

      <div className={styles.campo}>
        <label className={styles.label}>Usuario</label>
        <input type="text" value={pacienteForm.usuario} required className={styles.input}
          placeholder="Ej: juan.perez"
          onChange={(e) => { setPacienteForm((p) => ({ ...p, usuario: e.target.value })); setError(''); }} />
      </div>
      <div className={styles.campo}>
        <label className={styles.label}>DNI</label>
        <input type="text" value={pacienteForm.dni} inputMode="numeric" required className={styles.input}
          placeholder="Ej: 38456789"
          onChange={(e) => { setPacienteForm((p) => ({ ...p, dni: e.target.value })); setError(''); }} />
      </div>
      <div className={styles.campo}>
        <label className={styles.label}>Nombre completo</label>
        <input type="text" value={pacienteForm.nombre} required className={styles.input}
          placeholder="Ej: Juan Pérez"
          onChange={(e) => { setPacienteForm((p) => ({ ...p, nombre: e.target.value })); setError(''); }} />
      </div>

      {/* Obra social: se elige del catálogo, no se tipea. */}
      <div className={styles.campo}>
        <label htmlFor="select-obra-social" className={styles.label}>Obra social</label>
        <select id="select-obra-social" value={obraSocialNombre} onChange={handleObraSocial}
          required className={styles.input}>
          <option value="">— Elegí una obra social —</option>
          {obrasSociales.map((o) => (
            <option key={o.obra_social_id} value={o.nombre}>{o.nombre}</option>
          ))}
        </select>
      </div>

      {/* Plan: depende de la obra social elegida. */}
      <div className={styles.campo}>
        <label htmlFor="select-plan" className={styles.label}>Plan</label>
        <select id="select-plan" value={planNombre} onChange={(e) => { setPlanNombre(e.target.value); setError(''); }}
          required disabled={!obraSocialSel} className={styles.input}>
          <option value="">
            {obraSocialSel ? '— Elegí un plan —' : '— Primero elegí una obra social —'}
          </option>
          {obraSocialSel?.planes.map((p) => (
            <option key={p.nombre} value={p.nombre}>
              {p.nombre} ({p.coberturaGeneral}% de cobertura)
            </option>
          ))}
        </select>
      </div>

      {/* Cobertura del plan elegido: solo lectura, sale del catálogo. */}
      {planSel && (
        <div className={styles.seccionEsp}>
          <h3 className={styles.seccionEspTitulo}>
            {obraSocialSel.nombre} · Plan {planSel.nombre}
          </h3>
          <p className={styles.sinEsp}>
            Cobertura general: <strong>{planSel.coberturaGeneral}%</strong>
            {planSel.coberturaGeneral === 0 && ' (igual bonifica 10% en prácticas)'}
          </p>
        </div>
      )}

      <button type="submit" className={styles.submitBtn} disabled={cargando || !formCompleto}>
        {cargando ? 'Creando...' : 'Crear Paciente →'}
      </button>
    </form>
  );
}
