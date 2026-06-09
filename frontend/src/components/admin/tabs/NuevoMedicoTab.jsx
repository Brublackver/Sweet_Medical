'use client';

import { useState } from 'react';
import { crearMedico, agregarEspecialidadMedico } from '@/lib/api';
import EspecialidadesEditor from '../editors/EspecialidadesEditor';
import styles from '../AdminPage.module.css';

const MEDICO_VACIO       = { usuario: '', nombre: '', matricula: '' };
const ESPECIALIDAD_VACIA = { codigo: '', nombre: '', duracionTurnoEnMins: '', costo: '' };

const espValida = (f) =>
  f.codigo.trim() && f.nombre.trim() &&
  parseInt(f.duracionTurnoEnMins, 10) > 0 &&
  !isNaN(parseFloat(f.costo)) && parseFloat(f.costo) >= 0;

export default function NuevoMedicoTab() {
  const [medicoForm, setMedicoForm]         = useState(MEDICO_VACIO);
  const [especialidades, setEspecialidades] = useState([]);
  const [espForm, setEspForm]               = useState(ESPECIALIDAD_VACIA);
  const [cargando, setCargando]             = useState(false);
  const [resultado, setResultado]           = useState(null);
  const [error, setError]                   = useState('');

  const handleAgregarEsp = () => {
    if (!espValida(espForm)) return;
    setEspecialidades((p) => [...p, {
      codigo: espForm.codigo.trim().toUpperCase(),
      nombre: espForm.nombre.trim(),
      duracionTurnoEnMins: parseInt(espForm.duracionTurnoEnMins, 10),
      costo: parseFloat(espForm.costo),
    }]);
    setEspForm(ESPECIALIDAD_VACIA);
  };

  const handleCrearMedico = (e) => {
    e.preventDefault();
    setError('');
    setResultado(null);
    setCargando(true);
    crearMedico(medicoForm)
      .then((data) => {
        const id = data?.medico_id;
        if (!id || especialidades.length === 0) {
          setResultado({ data, especialidadesAgregadas: 0 });
          setMedicoForm(MEDICO_VACIO);
          setEspecialidades([]);
          return;
        }
        return especialidades
          .reduce((chain, esp) => chain.then(() => agregarEspecialidadMedico(id, esp)), Promise.resolve())
          .then(() => {
            setResultado({ data, especialidadesAgregadas: especialidades.length });
            setMedicoForm(MEDICO_VACIO);
            setEspecialidades([]);
          });
      })
      .catch((err) => setError(err.response?.data?.message || err.response?.data?.error || 'Error al crear el médico.'))
      .finally(() => setCargando(false));
  };

  return (
    <form onSubmit={handleCrearMedico} noValidate className={styles.form}>
      <h2 className={styles.formTitulo}>Registrar Médico</h2>

      {resultado && (
        <div className={styles.exito}>
          <span>✅</span>
          <span>
            Médico creado exitosamente. ID: {resultado.data?.medico_id}
            {resultado.especialidadesAgregadas > 0 ? ` · ${resultado.especialidadesAgregadas} especialidad/es agregadas` : ''}
          </span>
        </div>
      )}
      {error && <div className={styles.error}><span>⚠️</span><span>{error}</span></div>}

      <div className={styles.campo}>
        <label className={styles.label}>Usuario</label>
        <input type="text" value={medicoForm.usuario} maxLength={30} required className={styles.input}
          placeholder="Ej: dr.garcia"
          onChange={(e) => { setMedicoForm((p) => ({ ...p, usuario: e.target.value })); setError(''); }} />
      </div>
      <div className={styles.campo}>
        <label className={styles.label}>Nombre completo</label>
        <input type="text" value={medicoForm.nombre} maxLength={30} required className={styles.input}
          placeholder="Ej: Carlos García"
          onChange={(e) => { setMedicoForm((p) => ({ ...p, nombre: e.target.value })); setError(''); }} />
      </div>
      <div className={styles.campo}>
        <label className={styles.label}>Matrícula</label>
        <input type="text" value={medicoForm.matricula} maxLength={10} required className={styles.input}
          placeholder="Ej: MN12345"
          onChange={(e) => { setMedicoForm((p) => ({ ...p, matricula: e.target.value })); setError(''); }} />
      </div>

      <EspecialidadesEditor
        especialidades={especialidades}
        espForm={espForm}
        onFormChange={(campo, valor) => setEspForm((p) => ({ ...p, [campo]: valor }))}
        onAgregar={handleAgregarEsp}
        onQuitar={(i) => setEspecialidades((p) => p.filter((_, idx) => idx !== i))}
        espValida={espValida(espForm)}
      />

      <button type="submit" className={styles.submitBtn}
        disabled={cargando || !medicoForm.usuario.trim() || !medicoForm.nombre.trim() || !medicoForm.matricula.trim()}>
        {cargando ? 'Creando...' : 'Crear Médico →'}
      </button>
    </form>
  );
}
