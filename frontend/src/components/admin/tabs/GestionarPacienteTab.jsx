import { useState, useEffect } from 'react';
import {
  getPaciente, getAllPacientes, eliminarPaciente, resetearPasswordPaciente,
} from '@/lib/api';
import styles from '@/features/admin/AdminPage.module.css';

export default function GestionarPacienteTab() {
  const [buscarId, setBuscarId]                   = useState('');
  const [paciente, setPaciente]                   = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [nuevaPass, setNuevaPass]                 = useState('');
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

  const handleResetearPass = () => {
    if (nuevaPass.trim().length < 4 || !paciente) return;
    setCargando(true);
    resetearPasswordPaciente(paciente.paciente_id, nuevaPass)
      .then(() => mostrarExito(`Contraseña de @${paciente.usuario} actualizada. Clave temporal: "${nuevaPass}" — compartila con el paciente.`))
      .then(() => setNuevaPass(''))
      .catch((err) => mostrarError(err, 'Error al resetear la contraseña.'))
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
              {paciente.obraSocial} — Plan {paciente.plan?.nombre}
            </p>
          </div>

          {/* Cobertura del plan (solo lectura: sale del catálogo de obras sociales) */}
          <div className={styles.seccionEsp}>
            <h3 className={styles.seccionEspTitulo}>Cobertura</h3>
            <p className={styles.sinEsp}>
              Cobertura general: <strong>{paciente.plan?.coberturaGeneral ?? 0}%</strong>
              {(paciente.plan?.coberturaGeneral ?? 0) === 0 && ' (igual bonifica 10% en prácticas)'}
            </p>
            <p className={styles.sinEsp}>
              La cobertura se define por la obra social y el plan elegidos al crear la cuenta.
            </p>
          </div>

          {/* Reset de contraseña */}
          <div className={styles.seccionEsp}>
            <h3 className={styles.seccionEspTitulo}>Acceso (usuario y contraseña)</h3>
            <p className={styles.sinEsp}>
              Usuario: <strong>@{paciente.usuario}</strong>. La contraseña no se puede ver
              (está encriptada): asigná una temporal y compartila con el paciente.
            </p>
            <div className={styles.cobFormGrid}>
              <div className={styles.campo}>
                <label className={styles.labelSm}>Nueva contraseña</label>
                <input type="text" value={nuevaPass} placeholder="mín. 4 caracteres" className={styles.input}
                  onChange={(e) => { setNuevaPass(e.target.value); setError(''); }} />
              </div>
            </div>
            <button type="button" className={styles.agregarBtn}
              disabled={cargando || nuevaPass.trim().length < 4} onClick={handleResetearPass}>
              🔑 Resetear contraseña
            </button>
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
