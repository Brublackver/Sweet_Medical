import { useState } from 'react';
import { crearPaciente } from '@/lib/api';
import { cobValida } from '@/lib/adminUtils';
import CoberturaEditor from '../editors/CoberturaEditor';
import styles from '../AdminPage.module.css';

const PACIENTE_VACIO  = { usuario: '', dni: '', nombre: '', obraSocial: '', planNombre: '' };
const COBERTURA_VACIA = { codigo: '', nivel: '' };

export default function NuevoPacienteTab() {
  const [pacienteForm, setPacienteForm]         = useState(PACIENTE_VACIO);
  const [coberturasEsp, setCoberturasEsp]       = useState([]);
  const [cobEspForm, setCobEspForm]             = useState(COBERTURA_VACIA);
  const [coberturasPrac, setCoberturasPrac]     = useState([]);
  const [cobPracForm, setCobPracForm]           = useState(COBERTURA_VACIA);
  const [cargando, setCargando]                 = useState(false);
  const [resultado, setResultado]               = useState(null);
  const [error, setError]                       = useState('');

  const handleAgregarCobEsp = () => {
    if (!cobValida(cobEspForm)) return;
    setCoberturasEsp((p) => [...p, { especialidad: { codigo: cobEspForm.codigo.trim().toUpperCase() }, nivel: parseInt(cobEspForm.nivel, 10) }]);
    setCobEspForm(COBERTURA_VACIA);
  };

  const handleAgregarCobPrac = () => {
    if (!cobValida(cobPracForm)) return;
    setCoberturasPrac((p) => [...p, { practica: { codigo: cobPracForm.codigo.trim().toUpperCase() }, nivel: parseInt(cobPracForm.nivel, 10) }]);
    setCobPracForm(COBERTURA_VACIA);
  };

  const handleCrearPaciente = (e) => {
    e.preventDefault();
    setError('');
    setResultado(null);
    setCargando(true);
    const payload = {
      usuario:    pacienteForm.usuario,
      dni:        pacienteForm.dni,
      nombre:     pacienteForm.nombre,
      obraSocial: pacienteForm.obraSocial,
      plan: {
        nombre:                 pacienteForm.planNombre,
        coberturasEspecialidad: coberturasEsp,
        coberturasPractica:     coberturasPrac,
      },
    };
    crearPaciente(payload)
      .then((data) => {
        setResultado(data);
        setPacienteForm(PACIENTE_VACIO);
        setCoberturasEsp([]);
        setCoberturasPrac([]);
        setCobEspForm(COBERTURA_VACIA);
        setCobPracForm(COBERTURA_VACIA);
      })
      .catch((err) => setError(err.response?.data?.message || err.response?.data?.error || 'Error al crear el paciente.'))
      .finally(() => setCargando(false));
  };

  const formCompleto = pacienteForm.usuario.trim() && pacienteForm.dni.trim() &&
    pacienteForm.nombre.trim() && pacienteForm.obraSocial.trim() && pacienteForm.planNombre.trim();

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
      <div className={styles.campo}>
        <label className={styles.label}>Obra social</label>
        <input type="text" value={pacienteForm.obraSocial} required className={styles.input}
          placeholder="Ej: OSDE"
          onChange={(e) => { setPacienteForm((p) => ({ ...p, obraSocial: e.target.value })); setError(''); }} />
      </div>
      <div className={styles.campo}>
        <label className={styles.label}>Nombre del plan</label>
        <input type="text" value={pacienteForm.planNombre} required className={styles.input}
          placeholder="Ej: Plan 210"
          onChange={(e) => { setPacienteForm((p) => ({ ...p, planNombre: e.target.value })); setError(''); }} />
      </div>

      <CoberturaEditor
        titulo="Coberturas de especialidades"
        tipo="especialidad"
        items={coberturasEsp}
        form={cobEspForm}
        onFormChange={(c, v) => setCobEspForm((p) => ({ ...p, [c]: v }))}
        onAgregar={handleAgregarCobEsp}
        onQuitar={(i) => setCoberturasEsp((p) => p.filter((_, idx) => idx !== i))}
        valida={cobValida(cobEspForm)}
      />

      <CoberturaEditor
        titulo="Coberturas de prácticas"
        tipo="practica"
        items={coberturasPrac}
        form={cobPracForm}
        onFormChange={(c, v) => setCobPracForm((p) => ({ ...p, [c]: v }))}
        onAgregar={handleAgregarCobPrac}
        onQuitar={(i) => setCoberturasPrac((p) => p.filter((_, idx) => idx !== i))}
        valida={cobValida(cobPracForm)}
      />

      <button type="submit" className={styles.submitBtn} disabled={cargando || !formCompleto}>
        {cargando ? 'Creando...' : 'Crear Paciente →'}
      </button>
    </form>
  );
}
