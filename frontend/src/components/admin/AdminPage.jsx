'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import {
  crearMedico, agregarEspecialidadMedico, eliminarMedico,
  getMedico,
  crearPaciente, eliminarPaciente,
  getPaciente,
} from '@/lib/api';
import styles from './AdminPage.module.css';

const ESPECIALIDAD_VACIA  = { codigo: '', nombre: '', duracionTurnoEnMins: '', costo: '' };
const MEDICO_VACIO        = { usuario: '', nombre: '', matricula: '' };
const PACIENTE_VACIO      = { usuario: '', dni: '', nombre: '', obraSocial: '', planNombre: '' };
const COBERTURA_VACIA     = { codigo: '', nivel: '' };

const TABS = [
  { id: 'nuevo-medico',    label: '➕ Nuevo Médico' },
  { id: 'gestionar-medico', label: '👨‍⚕️ Gestionar Médico' },
  { id: 'nuevo-paciente',  label: '➕ Nuevo Paciente' },
  { id: 'gestionar-paciente', label: '👤 Gestionar Paciente' },
];

export default function AdminPage() {
  const { admin, logout } = useAdmin();
  const router = useRouter();

  const [seccion, setSeccion] = useState('nuevo-medico');

  // --- Nuevo médico ---
  const [medicoForm, setMedicoForm]           = useState(MEDICO_VACIO);
  const [especialidades, setEspecialidades]   = useState([]);
  const [espForm, setEspForm]                 = useState(ESPECIALIDAD_VACIA);

  // --- Gestionar médico existente ---
  const [buscarMedicoId, setBuscarMedicoId]   = useState('');
  const [medicoEncontrado, setMedicoEncontrado] = useState(null);
  const [espFormGestion, setEspFormGestion]   = useState(ESPECIALIDAD_VACIA);
  const [confirmarEliminarMedico, setConfirmarEliminarMedico] = useState(false);

  // --- Nuevo paciente ---
  const [pacienteForm, setPacienteForm]       = useState(PACIENTE_VACIO);
  const [coberturasEsp, setCoberturasEsp]     = useState([]);
  const [coberturasEspForm, setCoberturasEspForm] = useState(COBERTURA_VACIA);
  const [coberturasPrac, setCoberturasPrac]   = useState([]);
  const [coberturasEspFormPrac, setCoberturasEspFormPrac] = useState(COBERTURA_VACIA);

  // --- Gestionar paciente existente ---
  const [buscarPacienteId, setBuscarPacienteId] = useState('');
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
  const [confirmarEliminarPaciente, setConfirmarEliminarPaciente] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError]       = useState('');

  if (!admin) { router.replace('/login'); return null; }

  const handleLogout = () => { logout(); router.push('/login'); };

  const cambiarSeccion = (s) => {
    setSeccion(s);
    setResultado(null);
    setError('');
    setConfirmarEliminarMedico(false);
    setConfirmarEliminarPaciente(false);
  };

  const mostrarError   = (err, fallback) => setError(err.response?.data?.message || err.response?.data?.error || fallback);
  const mostrarExito   = (payload) => { setResultado(payload); setError(''); };

  // ── NUEVO MÉDICO ────────────────────────────────────────────────────────────

  const handleEspFormChange = (campo, valor) =>
    setEspForm((p) => ({ ...p, [campo]: valor }));

  const espValida = (f) =>
    f.codigo.trim() && f.nombre.trim() &&
    parseInt(f.duracionTurnoEnMins, 10) > 0 &&
    !isNaN(parseFloat(f.costo)) && parseFloat(f.costo) >= 0;

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
          mostrarExito({ tipo: 'medico-creado', data, especialidadesAgregadas: 0 });
          setMedicoForm(MEDICO_VACIO);
          setEspecialidades([]);
          return;
        }
        return especialidades
          .reduce((chain, esp) => chain.then(() => agregarEspecialidadMedico(id, esp)), Promise.resolve())
          .then(() => {
            mostrarExito({ tipo: 'medico-creado', data, especialidadesAgregadas: especialidades.length });
            setMedicoForm(MEDICO_VACIO);
            setEspecialidades([]);
          });
      })
      .catch((err) => mostrarError(err, 'Error al crear el médico.'))
      .finally(() => setCargando(false));
  };

  // ── GESTIONAR MÉDICO EXISTENTE ───────────────────────────────────────────────

  const handleBuscarMedico = (e) => {
    e.preventDefault();
    const id = parseInt(buscarMedicoId, 10);
    if (!id || id <= 0) { setError('Ingresá un ID válido.'); return; }
    setError('');
    setMedicoEncontrado(null);
    setConfirmarEliminarMedico(false);
    setCargando(true);
    getMedico(id)
      .then((data) => setMedicoEncontrado(data))
      .catch((err) => mostrarError(err, 'Médico no encontrado.'))
      .finally(() => setCargando(false));
  };

  const handleAgregarEspExistente = (e) => {
    e.preventDefault();
    if (!espValida(espFormGestion) || !medicoEncontrado) return;
    setCargando(true);
    agregarEspecialidadMedico(medicoEncontrado.medico_id, {
      codigo: espFormGestion.codigo.trim().toUpperCase(),
      nombre: espFormGestion.nombre.trim(),
      duracionTurnoEnMins: parseInt(espFormGestion.duracionTurnoEnMins, 10),
      costo: parseFloat(espFormGestion.costo),
    })
      .then((esp) => {
        setMedicoEncontrado((prev) => ({
          ...prev,
          especialidades: [...(prev.especialidades || []), esp],
        }));
        setEspFormGestion(ESPECIALIDAD_VACIA);
        mostrarExito({ tipo: 'esp-agregada', nombre: esp.nombre });
      })
      .catch((err) => mostrarError(err, 'Error al agregar especialidad.'))
      .finally(() => setCargando(false));
  };

  const handleEliminarMedico = () => {
    if (!medicoEncontrado) return;
    setCargando(true);
    eliminarMedico(medicoEncontrado.medico_id)
      .then(() => {
        mostrarExito({ tipo: 'medico-eliminado', nombre: medicoEncontrado.nombre });
        setMedicoEncontrado(null);
        setBuscarMedicoId('');
        setConfirmarEliminarMedico(false);
      })
      .catch((err) => mostrarError(err, 'Error al eliminar el médico.'))
      .finally(() => setCargando(false));
  };

  // ── NUEVO PACIENTE ──────────────────────────────────────────────────────────

  const handlePacienteChange = (campo, valor) => {
    setPacienteForm((p) => ({ ...p, [campo]: valor }));
    setError('');
  };

  const cobValida = (f) => f.codigo.trim() && parseInt(f.nivel, 10) >= 0 && parseInt(f.nivel, 10) <= 100 && f.nivel !== '';

  const handleAgregarCobEsp = () => {
    if (!cobValida(coberturasEspForm)) return;
    setCoberturasEsp((p) => [...p, { especialidad: { codigo: coberturasEspForm.codigo.trim().toUpperCase() }, nivel: parseInt(coberturasEspForm.nivel, 10) }]);
    setCoberturasEspForm(COBERTURA_VACIA);
  };

  const handleAgregarCobPrac = () => {
    if (!cobValida(coberturasEspFormPrac)) return;
    setCoberturasPrac((p) => [...p, { practica: { codigo: coberturasEspFormPrac.codigo.trim().toUpperCase() }, nivel: parseInt(coberturasEspFormPrac.nivel, 10) }]);
    setCoberturasEspFormPrac(COBERTURA_VACIA);
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
        mostrarExito({ tipo: 'paciente-creado', data });
        setPacienteForm(PACIENTE_VACIO);
        setCoberturasEsp([]);
        setCoberturasPrac([]);
        setCoberturasEspForm(COBERTURA_VACIA);
        setCoberturasEspFormPrac(COBERTURA_VACIA);
      })
      .catch((err) => mostrarError(err, 'Error al crear el paciente.'))
      .finally(() => setCargando(false));
  };

  // ── GESTIONAR PACIENTE EXISTENTE ─────────────────────────────────────────────

  const handleBuscarPaciente = (e) => {
    e.preventDefault();
    const id = parseInt(buscarPacienteId, 10);
    if (!id || id <= 0) { setError('Ingresá un ID válido.'); return; }
    setError('');
    setPacienteEncontrado(null);
    setConfirmarEliminarPaciente(false);
    setCargando(true);
    getPaciente(id)
      .then((data) => setPacienteEncontrado(data))
      .catch((err) => mostrarError(err, 'Paciente no encontrado.'))
      .finally(() => setCargando(false));
  };

  const handleEliminarPaciente = () => {
    if (!pacienteEncontrado) return;
    setCargando(true);
    eliminarPaciente(pacienteEncontrado.paciente_id)
      .then(() => {
        mostrarExito({ tipo: 'paciente-eliminado', nombre: pacienteEncontrado.nombre });
        setPacienteEncontrado(null);
        setBuscarPacienteId('');
        setConfirmarEliminarPaciente(false);
      })
      .catch((err) => mostrarError(err, 'Error al eliminar el paciente.'))
      .finally(() => setCargando(false));
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────

  const mensajeExito = () => {
    if (!resultado) return null;
    const msgs = {
      'medico-creado':    `Médico creado exitosamente. ID: ${resultado.data?.medico_id}${resultado.especialidadesAgregadas > 0 ? ` · ${resultado.especialidadesAgregadas} especialidad/es agregadas` : ''}`,
      'esp-agregada':     `Especialidad "${resultado.nombre}" agregada correctamente.`,
      'medico-eliminado': `Médico "${resultado.nombre}" eliminado del sistema.`,
      'paciente-creado':  `Paciente creado exitosamente. ID: ${resultado.data?.paciente_id}`,
      'paciente-eliminado': `Paciente "${resultado.nombre}" eliminado del sistema.`,
    };
    return msgs[resultado.tipo] || 'Operación exitosa.';
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.headerLogo}>🏥 Sweet Medical</span>
          <div className={styles.headerRight}>
            <span className={styles.adminTag}>🔐 Administrador</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>Salir</button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <h1 className={styles.titulo}>Panel de Administración</h1>
            <p className={styles.subtitulo}>Creá y gestioná médicos y pacientes del sistema</p>
          </div>

          <div className={styles.tabs} role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={seccion === t.id}
                onClick={() => cambiarSeccion(t.id)}
                className={`${styles.tab} ${seccion === t.id ? styles.tabActive : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.card}>
            {resultado && (
              <div className={styles.exito}>
                <span>✅</span>
                <span>{mensajeExito()}</span>
              </div>
            )}
            {error && (
              <div className={styles.error}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── NUEVO MÉDICO ── */}
            {seccion === 'nuevo-medico' && (
              <form onSubmit={handleCrearMedico} noValidate className={styles.form}>
                <h2 className={styles.formTitulo}>Registrar Médico</h2>

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
                  onFormChange={handleEspFormChange}
                  onAgregar={handleAgregarEsp}
                  onQuitar={(i) => setEspecialidades((p) => p.filter((_, idx) => idx !== i))}
                  espValida={espValida(espForm)}
                />

                <button type="submit" className={styles.submitBtn}
                  disabled={cargando || !medicoForm.usuario.trim() || !medicoForm.nombre.trim() || !medicoForm.matricula.trim()}>
                  {cargando ? 'Creando...' : 'Crear Médico →'}
                </button>
              </form>
            )}

            {/* ── GESTIONAR MÉDICO ── */}
            {seccion === 'gestionar-medico' && (
              <div className={styles.form}>
                <h2 className={styles.formTitulo}>Gestionar Médico existente</h2>

                <form onSubmit={handleBuscarMedico} noValidate className={styles.buscarRow}>
                  <input type="number" min="1" value={buscarMedicoId} className={styles.input}
                    placeholder="ID del médico"
                    onChange={(e) => { setBuscarMedicoId(e.target.value); setError(''); setMedicoEncontrado(null); }} />
                  <button type="submit" className={styles.buscarBtn} disabled={cargando || !buscarMedicoId.trim()}>
                    {cargando ? '...' : 'Buscar'}
                  </button>
                </form>

                {medicoEncontrado && (
                  <div className={styles.fichaBox}>
                    <div className={styles.fichaCabeza}>
                      <div>
                        <p className={styles.fichaNombre}>{medicoEncontrado.nombre}</p>
                        <p className={styles.fichaDetalle}>
                          ID {medicoEncontrado.medico_id} · {medicoEncontrado.matricula} · @{medicoEncontrado.usuario}
                        </p>
                      </div>
                    </div>

                    {/* Especialidades actuales */}
                    <div className={styles.seccionEsp}>
                      <h3 className={styles.seccionEspTitulo}>Especialidades actuales</h3>
                      {(medicoEncontrado.especialidades?.length ?? 0) === 0
                        ? <p className={styles.sinEsp}>Sin especialidades cargadas.</p>
                        : (
                          <ul className={styles.espLista}>
                            {medicoEncontrado.especialidades.map((esp) => (
                              <li key={esp.id ?? esp.codigo} className={styles.espItem}>
                                <div className={styles.espInfo}>
                                  <span className={styles.espNombre}>{esp.nombre}</span>
                                  <span className={styles.espDetalle}>{esp.codigo} · {esp.duracionTurnoEnMins} min · ${esp.costo}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )
                      }

                      {/* Agregar nueva especialidad */}
                      <form onSubmit={handleAgregarEspExistente} noValidate>
                        <p className={styles.labelSm} style={{ marginBottom: '0.5rem', marginTop: '0.75rem' }}>Agregar especialidad</p>
                        <div className={styles.espFormGrid}>
                          <div className={styles.campo}>
                            <label className={styles.labelSm}>Código</label>
                            <input type="text" maxLength={20} value={espFormGestion.codigo} className={styles.input}
                              placeholder="Ej: CARD"
                              onChange={(e) => setEspFormGestion((p) => ({ ...p, codigo: e.target.value }))} />
                          </div>
                          <div className={styles.campo}>
                            <label className={styles.labelSm}>Nombre</label>
                            <input type="text" maxLength={100} value={espFormGestion.nombre} className={styles.input}
                              placeholder="Ej: Cardiología"
                              onChange={(e) => setEspFormGestion((p) => ({ ...p, nombre: e.target.value }))} />
                          </div>
                          <div className={styles.campo}>
                            <label className={styles.labelSm}>Duración (min)</label>
                            <input type="number" min="1" value={espFormGestion.duracionTurnoEnMins} className={styles.input}
                              placeholder="30"
                              onChange={(e) => setEspFormGestion((p) => ({ ...p, duracionTurnoEnMins: e.target.value }))} />
                          </div>
                          <div className={styles.campo}>
                            <label className={styles.labelSm}>Costo ($)</label>
                            <input type="number" min="0" step="0.01" value={espFormGestion.costo} className={styles.input}
                              placeholder="5000"
                              onChange={(e) => setEspFormGestion((p) => ({ ...p, costo: e.target.value }))} />
                          </div>
                        </div>
                        <button type="submit" className={styles.agregarBtn}
                          disabled={cargando || !espValida(espFormGestion)}>
                          + Agregar especialidad
                        </button>
                      </form>
                    </div>

                    {/* Eliminar médico */}
                    <div className={styles.zonaEliminar}>
                      {!confirmarEliminarMedico
                        ? (
                          <button type="button" className={styles.eliminarBtn}
                            onClick={() => setConfirmarEliminarMedico(true)}>
                            Eliminar médico
                          </button>
                        )
                        : (
                          <div className={styles.confirmBox}>
                            <p className={styles.confirmTexto}>
                              ¿Eliminar a <strong>{medicoEncontrado.nombre}</strong>? Esta acción no se puede deshacer.
                            </p>
                            <div className={styles.confirmBtns}>
                              <button type="button" className={styles.confirmarEliminarBtn}
                                disabled={cargando} onClick={handleEliminarMedico}>
                                {cargando ? 'Eliminando...' : 'Sí, eliminar'}
                              </button>
                              <button type="button" className={styles.cancelarBtn}
                                onClick={() => setConfirmarEliminarMedico(false)}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── NUEVO PACIENTE ── */}
            {seccion === 'nuevo-paciente' && (
              <form onSubmit={handleCrearPaciente} noValidate className={styles.form}>
                <h2 className={styles.formTitulo}>Registrar Paciente</h2>

                <div className={styles.campo}>
                  <label className={styles.label}>Usuario</label>
                  <input type="text" value={pacienteForm.usuario} required className={styles.input}
                    placeholder="Ej: juan.perez"
                    onChange={(e) => handlePacienteChange('usuario', e.target.value)} />
                </div>
                <div className={styles.campo}>
                  <label className={styles.label}>DNI</label>
                  <input type="text" value={pacienteForm.dni} inputMode="numeric" required className={styles.input}
                    placeholder="Ej: 38456789"
                    onChange={(e) => handlePacienteChange('dni', e.target.value)} />
                </div>
                <div className={styles.campo}>
                  <label className={styles.label}>Nombre completo</label>
                  <input type="text" value={pacienteForm.nombre} required className={styles.input}
                    placeholder="Ej: Juan Pérez"
                    onChange={(e) => handlePacienteChange('nombre', e.target.value)} />
                </div>
                <div className={styles.campo}>
                  <label className={styles.label}>Obra social</label>
                  <input type="text" value={pacienteForm.obraSocial} required className={styles.input}
                    placeholder="Ej: OSDE"
                    onChange={(e) => handlePacienteChange('obraSocial', e.target.value)} />
                </div>
                <div className={styles.campo}>
                  <label className={styles.label}>Nombre del plan</label>
                  <input type="text" value={pacienteForm.planNombre} required className={styles.input}
                    placeholder="Ej: Plan 210"
                    onChange={(e) => handlePacienteChange('planNombre', e.target.value)} />
                </div>

                {/* Coberturas de especialidades */}
                <CoberturaEditor
                  titulo="Coberturas de especialidades"
                  tipo="especialidad"
                  items={coberturasEsp}
                  form={coberturasEspForm}
                  onFormChange={(c, v) => setCoberturasEspForm((p) => ({ ...p, [c]: v }))}
                  onAgregar={handleAgregarCobEsp}
                  onQuitar={(i) => setCoberturasEsp((p) => p.filter((_, idx) => idx !== i))}
                  valida={cobValida(coberturasEspForm)}
                />

                {/* Coberturas de prácticas */}
                <CoberturaEditor
                  titulo="Coberturas de prácticas"
                  tipo="practica"
                  items={coberturasPrac}
                  form={coberturasEspFormPrac}
                  onFormChange={(c, v) => setCoberturasEspFormPrac((p) => ({ ...p, [c]: v }))}
                  onAgregar={handleAgregarCobPrac}
                  onQuitar={(i) => setCoberturasPrac((p) => p.filter((_, idx) => idx !== i))}
                  valida={cobValida(coberturasEspFormPrac)}
                />

                <button type="submit" className={styles.submitBtn}
                  disabled={cargando || !pacienteForm.usuario.trim() || !pacienteForm.dni.trim() || !pacienteForm.nombre.trim() || !pacienteForm.obraSocial.trim() || !pacienteForm.planNombre.trim()}>
                  {cargando ? 'Creando...' : 'Crear Paciente →'}
                </button>
              </form>
            )}

            {/* ── GESTIONAR PACIENTE ── */}
            {seccion === 'gestionar-paciente' && (
              <div className={styles.form}>
                <h2 className={styles.formTitulo}>Gestionar Paciente existente</h2>

                <form onSubmit={handleBuscarPaciente} noValidate className={styles.buscarRow}>
                  <input type="number" min="1" value={buscarPacienteId} className={styles.input}
                    placeholder="ID del paciente"
                    onChange={(e) => { setBuscarPacienteId(e.target.value); setError(''); setPacienteEncontrado(null); }} />
                  <button type="submit" className={styles.buscarBtn} disabled={cargando || !buscarPacienteId.trim()}>
                    {cargando ? '...' : 'Buscar'}
                  </button>
                </form>

                {pacienteEncontrado && (
                  <div className={styles.fichaBox}>
                    <div className={styles.fichaCabeza}>
                      <div>
                        <p className={styles.fichaNombre}>{pacienteEncontrado.nombre}</p>
                        <p className={styles.fichaDetalle}>
                          ID {pacienteEncontrado.paciente_id} · DNI {pacienteEncontrado.dni} · @{pacienteEncontrado.usuario}
                        </p>
                        <p className={styles.fichaDetalle}>
                          {pacienteEncontrado.obraSocial} — {pacienteEncontrado.plan?.nombre}
                        </p>
                      </div>
                    </div>

                    <div className={styles.zonaEliminar}>
                      {!confirmarEliminarPaciente
                        ? (
                          <button type="button" className={styles.eliminarBtn}
                            onClick={() => setConfirmarEliminarPaciente(true)}>
                            Eliminar paciente
                          </button>
                        )
                        : (
                          <div className={styles.confirmBox}>
                            <p className={styles.confirmTexto}>
                              ¿Eliminar a <strong>{pacienteEncontrado.nombre}</strong>? Esta acción no se puede deshacer.
                            </p>
                            <div className={styles.confirmBtns}>
                              <button type="button" className={styles.confirmarEliminarBtn}
                                disabled={cargando} onClick={handleEliminarPaciente}>
                                {cargando ? 'Eliminando...' : 'Sí, eliminar'}
                              </button>
                              <button type="button" className={styles.cancelarBtn}
                                onClick={() => setConfirmarEliminarPaciente(false)}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function CoberturaEditor({ titulo, tipo, items, form, onFormChange, onAgregar, onQuitar, valida }) {
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

function EspecialidadesEditor({ especialidades, espForm, onFormChange, onAgregar, onQuitar, espValida }) {
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
