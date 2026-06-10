import { useState, useEffect } from 'react';
import {
  getPaciente, getAllPacientes, eliminarPaciente,
  agregarCoberturaEspecialidad, quitarCoberturaEspecialidad,
  agregarCoberturaPractica, quitarCoberturaPractica,
} from '@/lib/api';
import { cobValida } from '@/lib/adminUtils';
import styles from '@/features/admin/AdminPage.module.css';

const COBERTURA_VACIA = { codigo: '', nivel: '' };

export default function GestionarPacienteTab() {
  const [buscarId, setBuscarId]                   = useState('');
  const [paciente, setPaciente]                   = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [cobEspForm, setCobEspForm]               = useState(COBERTURA_VACIA);
  const [cobPracForm, setCobPracForm]             = useState(COBERTURA_VACIA);
  const [cargando, setCargando]                   = useState(false);
  const [resultado, setResultado]                 = useState('');
  const [error, setError]                         = useState('');
  const [pacientesLista, setPacientesLista]       = useState([]);

  // Lista de pacientes para el selector (GetAll), así no hay que adivinar IDs.
  useEffect(() => {
    getAllPacientes().then(setPacientesLista).catch(() => {});
  }, []);

  const mostrarError = (err, fallback) => setError(err.response?.data?.message || err.response?.data?.error || fallback);
  const mostrarExito = (msg) => { setResultado(msg); setError(''); };

  const buscarPorId = (idRaw) => {
    const id = parseInt(idRaw, 10);
    if (!id || id <= 0) { setError('Ingresá un ID válido.'); return; }
    setError('');
    setPaciente(null);
    setConfirmarEliminar(false);
    setCargando(true);
    getPaciente(id)
      .then((data) => setPaciente(data))
      .catch((err) => mostrarError(err, 'Paciente no encontrado.'))
      .finally(() => setCargando(false));
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    buscarPorId(buscarId);
  };

  const handleSeleccion = (e) => {
    const id = e.target.value;
    setBuscarId(id);
    if (id) buscarPorId(id);
  };

  const handleEliminar = () => {
    if (!paciente) return;
    setCargando(true);
    eliminarPaciente(paciente.paciente_id)
      .then(() => {
        mostrarExito(`Paciente "${paciente.nombre}" eliminado del sistema.`);
        setPaciente(null);
        setBuscarId('');
        setConfirmarEliminar(false);
      })
      .catch((err) => mostrarError(err, 'Error al eliminar el paciente.'))
      .finally(() => setCargando(false));
  };

  const handleAgregarCobEsp = (e) => {
    e.preventDefault();
    if (!cobValida(cobEspForm) || !paciente) return;
    setCargando(true);
    agregarCoberturaEspecialidad(paciente.paciente_id, {
      codigo: cobEspForm.codigo.trim().toUpperCase(),
      nivel:  parseInt(cobEspForm.nivel, 10),
    })
      .then((data) => {
        setPaciente(data);
        setCobEspForm(COBERTURA_VACIA);
        mostrarExito(`Especialidad ${cobEspForm.codigo.trim().toUpperCase()} agregada.`);
      })
      .catch((err) => mostrarError(err, 'Error al agregar cobertura.'))
      .finally(() => setCargando(false));
  };

  const handleQuitarCobEsp = (codigo) => {
    setCargando(true);
    quitarCoberturaEspecialidad(paciente.paciente_id, codigo)
      .then((data) => { setPaciente(data); mostrarExito(`Especialidad ${codigo} eliminada.`); })
      .catch((err) => mostrarError(err, 'Error al quitar cobertura.'))
      .finally(() => setCargando(false));
  };

  const handleAgregarCobPrac = (e) => {
    e.preventDefault();
    if (!cobValida(cobPracForm) || !paciente) return;
    setCargando(true);
    agregarCoberturaPractica(paciente.paciente_id, {
      codigo: cobPracForm.codigo.trim().toUpperCase(),
      nivel:  parseInt(cobPracForm.nivel, 10),
    })
      .then((data) => {
        setPaciente(data);
        setCobPracForm(COBERTURA_VACIA);
        mostrarExito(`Práctica ${cobPracForm.codigo.trim().toUpperCase()} agregada.`);
      })
      .catch((err) => mostrarError(err, 'Error al agregar cobertura.'))
      .finally(() => setCargando(false));
  };

  const handleQuitarCobPrac = (codigo) => {
    setCargando(true);
    quitarCoberturaPractica(paciente.paciente_id, codigo)
      .then((data) => { setPaciente(data); mostrarExito(`Práctica ${codigo} eliminada.`); })
      .catch((err) => mostrarError(err, 'Error al quitar cobertura.'))
      .finally(() => setCargando(false));
  };

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitulo}>Gestionar Paciente existente</h2>

      {resultado && <div className={styles.exito}><span>✅</span><span>{resultado}</span></div>}
      {error && <div className={styles.error}><span>⚠️</span><span>{error}</span></div>}

      <div className={styles.campo}>
        <label htmlFor="selector-paciente" className={styles.labelSm}>Seleccionar paciente</label>
        <select id="selector-paciente" value={buscarId} onChange={handleSeleccion} className={styles.input}>
          <option value="">— Elegí un paciente de la lista —</option>
          {pacientesLista.map((p) => (
            <option key={p.paciente_id} value={p.paciente_id}>{p.nombre} (#{p.paciente_id})</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleBuscar} noValidate className={styles.buscarRow}>
        <input type="number" min="1" value={buscarId} className={styles.input}
          placeholder="…o ingresá el ID a mano"
          onChange={(e) => { setBuscarId(e.target.value); setError(''); setPaciente(null); }} />
        <button type="submit" className={styles.buscarBtn} disabled={cargando || !buscarId.trim()}>
          {cargando ? '...' : 'Buscar'}
        </button>
      </form>

      {paciente && (
        <div className={styles.fichaBox}>
          <div className={styles.fichaCabeza}>
            <p className={styles.fichaNombre}>{paciente.nombre}</p>
            <p className={styles.fichaDetalle}>
              ID {paciente.paciente_id} · DNI {paciente.dni} · @{paciente.usuario}
            </p>
            <p className={styles.fichaDetalle}>
              {paciente.obraSocial} — {paciente.plan?.nombre}
            </p>
          </div>

          {/* Coberturas especialidades */}
          <div className={styles.seccionEsp}>
            <h3 className={styles.seccionEspTitulo}>Coberturas de especialidades</h3>
            {(paciente.plan?.coberturasEspecialidad?.length ?? 0) === 0
              ? <p className={styles.sinEsp}>Sin coberturas de especialidad.</p>
              : (
                <ul className={styles.espLista}>
                  {paciente.plan.coberturasEspecialidad.map((c) => (
                    <li key={c.especialidad.codigo} className={styles.espItem}>
                      <div className={styles.espInfo}>
                        <span className={styles.espNombre}>{c.especialidad.codigo}</span>
                        <span className={styles.espDetalle}>{c.nivel}% de cobertura</span>
                      </div>
                      <button type="button" disabled={cargando}
                        onClick={() => handleQuitarCobEsp(c.especialidad.codigo)}
                        className={styles.espQuitar}>✕</button>
                    </li>
                  ))}
                </ul>
              )
            }
            <form onSubmit={handleAgregarCobEsp} noValidate>
              <p className={styles.labelSubseccion}>Agregar cobertura</p>
              <div className={styles.cobFormGrid}>
                <div className={styles.campo}>
                  <label className={styles.labelSm}>Cód. especialidad</label>
                  <input type="text" maxLength={20} value={cobEspForm.codigo} placeholder="Ej: CARD" className={styles.input}
                    onChange={(e) => setCobEspForm((p) => ({ ...p, codigo: e.target.value }))} />
                </div>
                <div className={styles.campo}>
                  <label className={styles.labelSm}>Nivel (0–100%)</label>
                  <input type="number" min="0" max="100" value={cobEspForm.nivel} placeholder="80" className={styles.input}
                    onChange={(e) => setCobEspForm((p) => ({ ...p, nivel: e.target.value }))} />
                </div>
              </div>
              <button type="submit" disabled={cargando || !cobValida(cobEspForm)} className={styles.agregarBtn}>
                + Agregar cobertura especialidad
              </button>
            </form>
          </div>

          {/* Coberturas prácticas */}
          <div className={styles.seccionEsp}>
            <h3 className={styles.seccionEspTitulo}>Coberturas de prácticas</h3>
            {(paciente.plan?.coberturasPractica?.length ?? 0) === 0
              ? <p className={styles.sinEsp}>Sin coberturas de práctica.</p>
              : (
                <ul className={styles.espLista}>
                  {paciente.plan.coberturasPractica.map((c) => (
                    <li key={c.practica.codigo} className={styles.espItem}>
                      <div className={styles.espInfo}>
                        <span className={styles.espNombre}>{c.practica.codigo}</span>
                        <span className={styles.espDetalle}>{c.nivel}% de cobertura</span>
                      </div>
                      <button type="button" disabled={cargando}
                        onClick={() => handleQuitarCobPrac(c.practica.codigo)}
                        className={styles.espQuitar}>✕</button>
                    </li>
                  ))}
                </ul>
              )
            }
            <form onSubmit={handleAgregarCobPrac} noValidate>
              <p className={styles.labelSubseccion}>Agregar cobertura</p>
              <div className={styles.cobFormGrid}>
                <div className={styles.campo}>
                  <label className={styles.labelSm}>Cód. práctica</label>
                  <input type="text" maxLength={20} value={cobPracForm.codigo} placeholder="Ej: ECO" className={styles.input}
                    onChange={(e) => setCobPracForm((p) => ({ ...p, codigo: e.target.value }))} />
                </div>
                <div className={styles.campo}>
                  <label className={styles.labelSm}>Nivel (0–100%)</label>
                  <input type="number" min="0" max="100" value={cobPracForm.nivel} placeholder="60" className={styles.input}
                    onChange={(e) => setCobPracForm((p) => ({ ...p, nivel: e.target.value }))} />
                </div>
              </div>
              <button type="submit" disabled={cargando || !cobValida(cobPracForm)} className={styles.agregarBtn}>
                + Agregar cobertura práctica
              </button>
            </form>
          </div>

          <div className={styles.zonaEliminar}>
            {!confirmarEliminar
              ? (
                <button type="button" className={styles.eliminarBtn} onClick={() => setConfirmarEliminar(true)}>
                  Eliminar paciente
                </button>
              )
              : (
                <div className={styles.confirmBox}>
                  <p className={styles.confirmTexto}>
                    ¿Eliminar a <strong>{paciente.nombre}</strong>? Esta acción no se puede deshacer.
                  </p>
                  <div className={styles.confirmBtns}>
                    <button type="button" className={styles.confirmarEliminarBtn}
                      disabled={cargando} onClick={handleEliminar}>
                      {cargando ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                    <button type="button" className={styles.cancelarBtn} onClick={() => setConfirmarEliminar(false)}>
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
  );
}
