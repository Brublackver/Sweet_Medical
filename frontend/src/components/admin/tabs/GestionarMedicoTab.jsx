import { useState, useEffect } from 'react';
import { getMedico, getAllMedicos, agregarEspecialidadMedico, eliminarMedico, resetearPasswordMedico } from '@/lib/api';
import { espValida } from '@/lib/adminUtils';
import styles from '@/features/admin/AdminPage.module.css';

const ESPECIALIDAD_VACIA = { codigo: '', nombre: '', duracionTurnoEnMins: '', costo: '' };

export default function GestionarMedicoTab() {
  const [buscarId, setBuscarId]                 = useState('');
  const [medico, setMedico]                     = useState(null);
  const [espForm, setEspForm]                   = useState(ESPECIALIDAD_VACIA);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [nuevaPass, setNuevaPass]               = useState('');
  const [cargando, setCargando]                 = useState(false);
  const [resultado, setResultado]               = useState('');
  const [error, setError]                       = useState('');
  const [medicosLista, setMedicosLista]         = useState([]);

  // Lista de médicos para el selector (GetAll), así no hay que adivinar IDs.
  useEffect(() => {
    getAllMedicos().then(setMedicosLista).catch(() => {});
  }, []);

  const mostrarError = (err, fallback) => setError(err.response?.data?.message || err.response?.data?.error || fallback);

  const buscarPorId = (idRaw) => {
    const id = parseInt(idRaw, 10);
    if (!id || id <= 0) { setError('Ingresá un ID válido.'); return; }
    setError('');
    setMedico(null);
    setConfirmarEliminar(false);
    setCargando(true);
    getMedico(id)
      .then((data) => setMedico(data))
      .catch((err) => mostrarError(err, 'Médico no encontrado.'))
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

  const handleAgregarEsp = (e) => {
    e.preventDefault();
    if (!espValida(espForm) || !medico) return;
    setCargando(true);
    agregarEspecialidadMedico(medico.medico_id, {
      codigo: espForm.codigo.trim().toUpperCase(),
      nombre: espForm.nombre.trim(),
      duracionTurnoEnMins: parseInt(espForm.duracionTurnoEnMins, 10),
      costo: parseFloat(espForm.costo),
    })
      .then((esp) => {
        setMedico((prev) => ({ ...prev, especialidades: [...(prev.especialidades || []), esp] }));
        setEspForm(ESPECIALIDAD_VACIA);
        setResultado(`Especialidad "${esp.nombre}" agregada correctamente.`);
        setError('');
      })
      .catch((err) => mostrarError(err, 'Error al agregar especialidad.'))
      .finally(() => setCargando(false));
  };

  const handleResetearPass = () => {
    if (nuevaPass.trim().length < 4 || !medico) return;
    setCargando(true);
    resetearPasswordMedico(medico.medico_id, nuevaPass)
      .then(() => {
        setResultado(`Contraseña de @${medico.usuario} actualizada. Clave temporal: "${nuevaPass}" — compartila con el médico.`);
        setError('');
        setNuevaPass('');
      })
      .catch((err) => mostrarError(err, 'Error al resetear la contraseña.'))
      .finally(() => setCargando(false));
  };

  const handleEliminar = () => {
    if (!medico) return;
    setCargando(true);
    eliminarMedico(medico.medico_id)
      .then(() => {
        setResultado(`Médico "${medico.nombre}" eliminado del sistema.`);
        setError('');
        setMedico(null);
        setBuscarId('');
        setConfirmarEliminar(false);
      })
      .catch((err) => mostrarError(err, 'Error al eliminar el médico.'))
      .finally(() => setCargando(false));
  };

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitulo}>Gestionar Médico existente</h2>

      {resultado && <div className={styles.exito}><span>✅</span><span>{resultado}</span></div>}
      {error && <div className={styles.error}><span>⚠️</span><span>{error}</span></div>}

      <div className={styles.campo}>
        <label htmlFor="selector-medico" className={styles.labelSm}>Seleccionar médico</label>
        <select id="selector-medico" value={buscarId} onChange={handleSeleccion} className={styles.input}>
          <option value="">— Elegí un médico de la lista —</option>
          {medicosLista.map((m) => (
            <option key={m.medico_id} value={m.medico_id}>{m.nombre} (#{m.medico_id})</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleBuscar} noValidate className={styles.buscarRow}>
        <input type="number" min="1" value={buscarId} className={styles.input}
          placeholder="…o ingresá el ID a mano"
          onChange={(e) => { setBuscarId(e.target.value); setError(''); setMedico(null); }} />
        <button type="submit" className={styles.buscarBtn} disabled={cargando || !buscarId.trim()}>
          {cargando ? '...' : 'Buscar'}
        </button>
      </form>

      {medico && (
        <div className={styles.fichaBox}>
          <div className={styles.fichaCabeza}>
            <p className={styles.fichaNombre}>{medico.nombre}</p>
            <p className={styles.fichaDetalle}>
              ID {medico.medico_id} · {medico.matricula} · @{medico.usuario}
            </p>
          </div>

          <div className={styles.seccionEsp}>
            <h3 className={styles.seccionEspTitulo}>Especialidades actuales</h3>
            {(medico.especialidades?.length ?? 0) === 0
              ? <p className={styles.sinEsp}>Sin especialidades cargadas.</p>
              : (
                <ul className={styles.espLista}>
                  {medico.especialidades.map((esp) => (
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

            <form onSubmit={handleAgregarEsp} noValidate>
              <p className={styles.labelSubseccion}>Agregar especialidad</p>
              <div className={styles.espFormGrid}>
                <div className={styles.campo}>
                  <label className={styles.labelSm}>Código</label>
                  <input type="text" maxLength={20} value={espForm.codigo} placeholder="Ej: CARD" className={styles.input}
                    onChange={(e) => setEspForm((p) => ({ ...p, codigo: e.target.value }))} />
                </div>
                <div className={styles.campo}>
                  <label className={styles.labelSm}>Nombre</label>
                  <input type="text" maxLength={100} value={espForm.nombre} placeholder="Ej: Cardiología" className={styles.input}
                    onChange={(e) => setEspForm((p) => ({ ...p, nombre: e.target.value }))} />
                </div>
                <div className={styles.campo}>
                  <label className={styles.labelSm}>Duración (min)</label>
                  <input type="number" min="1" value={espForm.duracionTurnoEnMins} placeholder="30" className={styles.input}
                    onChange={(e) => setEspForm((p) => ({ ...p, duracionTurnoEnMins: e.target.value }))} />
                </div>
                <div className={styles.campo}>
                  <label className={styles.labelSm}>Costo ($)</label>
                  <input type="number" min="0" step="0.01" value={espForm.costo} placeholder="5000" className={styles.input}
                    onChange={(e) => setEspForm((p) => ({ ...p, costo: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className={styles.agregarBtn} disabled={cargando || !espValida(espForm)}>
                + Agregar especialidad
              </button>
            </form>
          </div>

          {/* Reset de contraseña */}
          <div className={styles.seccionEsp}>
            <h3 className={styles.seccionEspTitulo}>Acceso (usuario y contraseña)</h3>
            <p className={styles.sinEsp}>
              Usuario: <strong>@{medico.usuario}</strong>. La contraseña no se puede ver
              (está encriptada): asigná una temporal y compartila con el médico.
            </p>
            <div className={styles.espFormGrid}>
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
                  Eliminar médico
                </button>
              )
              : (
                <div className={styles.confirmBox}>
                  <p className={styles.confirmTexto}>
                    ¿Eliminar a <strong>{medico.nombre}</strong>? Esta acción no se puede deshacer.
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
