'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getAllPersonal, crearPersonal, actualizarPersonal,
  cambiarEstadoPersonal, eliminarPersonal,
} from '@/lib/api';
import styles from '@/features/admin/AdminPage.module.css';

/*
  PersonalTab — alta, edición, baja y listado del personal NO médico.

  Los tipos se muestran desde una constante local con su etiqueta legible. El
  backend expone GET /personal/tipos, pero para pintar el formulario necesitamos
  además el label en castellano: agregar un tipo nuevo es tocar TIPOS acá y
  TIPOS_PERSONAL en el dominio.
*/

const TIPOS = [
  { valor: 'ADMINISTRACION', label: 'Administración' },
  { valor: 'LIMPIEZA',       label: 'Limpieza' },
];

const etiquetaTipo = (valor) => TIPOS.find((t) => t.valor === valor)?.label ?? valor;

const FORM_VACIO = {
  nombre: '', apellido: '', documento: '', telefono: '',
  email: '', tipo: 'ADMINISTRACION', sede: '', observaciones: '',
};

export default function PersonalTab() {
  const [personal, setPersonal]   = useState([]);
  const [form, setForm]           = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [filtroTipo, setFiltroTipo]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando]   = useState(false);
  const [exito, setExito]         = useState('');
  const [error, setError]         = useState('');
  const [confirmarId, setConfirmarId] = useState(null);

  const cargar = useCallback(() => {
    const filtros = {};
    if (filtroTipo)   filtros.tipo   = filtroTipo;
    if (filtroEstado) filtros.activo = filtroEstado === 'activos';

    getAllPersonal(filtros)
      .then(setPersonal)
      .catch(() => setError('No se pudo cargar el listado de personal.'));
  }, [filtroTipo, filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  const set = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
    setError('');
  };

  const limpiar = () => {
    setForm(FORM_VACIO);
    setEditandoId(null);
    setError('');
  };

  // Los opcionales vacíos viajan como null, no como '': el backend valida
  // longitud mínima y un string vacío sería un dato inválido, no "sin dato".
  const payload = () => ({
    nombre:        form.nombre.trim(),
    apellido:      form.apellido.trim(),
    documento:     form.documento.trim(),
    tipo:          form.tipo,
    telefono:      form.telefono.trim()      || null,
    email:         form.email.trim()         || null,
    sede:          form.sede.trim()          || null,
    observaciones: form.observaciones.trim() || null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    const accion = editandoId
      ? actualizarPersonal(editandoId, payload())
      : crearPersonal(payload());

    accion
      .then((guardado) => {
        setExito(editandoId
          ? `Personal actualizado: ${guardado.nombre_completo}`
          : `Personal creado: ${guardado.nombre_completo} (ID ${guardado.personal_id})`);
        limpiar();
        cargar();
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo guardar el personal.'))
      .finally(() => setCargando(false));
  };

  const handleEditar = (p) => {
    setEditandoId(p.personal_id);
    setForm({
      nombre:        p.nombre,
      apellido:      p.apellido,
      documento:     p.documento,
      telefono:      p.telefono      ?? '',
      email:         p.email         ?? '',
      tipo:          p.tipo,
      sede:          p.sede          ?? '',
      observaciones: p.observaciones ?? '',
    });
    setExito('');
    setError('');
  };

  const handleEstado = (p) => {
    setError('');
    cambiarEstadoPersonal(p.personal_id, !p.activo)
      .then(() => {
        setExito(`${p.nombre_completo} quedó ${p.activo ? 'inactivo' : 'activo'}.`);
        cargar();
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cambiar el estado.'));
  };

  const handleEliminar = (p) => {
    setError('');
    eliminarPersonal(p.personal_id)
      .then(() => {
        setExito(`Se eliminó el legajo de ${p.nombre_completo}.`);
        setConfirmarId(null);
        if (editandoId === p.personal_id) limpiar();
        cargar();
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo eliminar el legajo.'));
  };

  const formCompleto = form.nombre.trim() && form.apellido.trim() && form.documento.trim();

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <h2 className={styles.formTitulo}>
          {editandoId ? 'Editar personal' : 'Registrar personal'}
        </h2>

        {exito && <div className={styles.exito}><span>✅</span><span>{exito}</span></div>}
        {error && <div className={styles.error}><span>⚠️</span><span>{error}</span></div>}

        <div className={styles.espFormGrid}>
          <div className={styles.campo}>
            <label className={styles.label}>Nombre</label>
            <input type="text" value={form.nombre} onChange={set('nombre')} required
              className={styles.input} placeholder="Ej: Lucía" />
          </div>
          <div className={styles.campo}>
            <label className={styles.label}>Apellido</label>
            <input type="text" value={form.apellido} onChange={set('apellido')} required
              className={styles.input} placeholder="Ej: Gómez" />
          </div>
        </div>

        <div className={styles.espFormGrid}>
          <div className={styles.campo}>
            <label className={styles.label}>Documento</label>
            <input type="text" value={form.documento} onChange={set('documento')} required
              inputMode="numeric" className={styles.input} placeholder="Ej: 30111222" />
          </div>
          <div className={styles.campo}>
            <label className={styles.label}>Tipo de personal</label>
            <select value={form.tipo} onChange={set('tipo')} className={styles.input}>
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.espFormGrid}>
          <div className={styles.campo}>
            <label className={styles.label}>
              Teléfono <span className={styles.opcional}>(opcional)</span>
            </label>
            <input type="tel" value={form.telefono} onChange={set('telefono')}
              className={styles.input} placeholder="Ej: 1155667788" />
          </div>
          <div className={styles.campo}>
            <label className={styles.label}>
              Email <span className={styles.opcional}>(opcional)</span>
            </label>
            <input type="email" value={form.email} onChange={set('email')}
              className={styles.input} placeholder="Ej: lucia@sweetmedical.com" />
          </div>
        </div>

        <div className={styles.campo}>
          <label className={styles.label}>
            Sede <span className={styles.opcional}>(opcional)</span>
          </label>
          <input type="text" value={form.sede} onChange={set('sede')}
            className={styles.input} placeholder="Ej: Medrano" />
        </div>

        <div className={styles.campo}>
          <label className={styles.label}>
            Observaciones <span className={styles.opcional}>(opcional)</span>
          </label>
          <input type="text" value={form.observaciones} onChange={set('observaciones')}
            className={styles.input} placeholder="Ej: turno tarde" />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={cargando || !formCompleto}>
          {cargando ? 'Guardando...' : editandoId ? 'Guardar cambios →' : 'Crear personal →'}
        </button>

        {editandoId && (
          <button type="button" onClick={limpiar} className={styles.cancelarBtn}>
            Cancelar edición
          </button>
        )}
      </form>

      {/* ====== LISTADO ====== */}
      <div className={styles.seccionEsp}>
        <h3 className={styles.seccionEspTitulo}>Personal registrado ({personal.length})</h3>

        <div className={styles.espFormGrid}>
          <div className={styles.campo}>
            <label className={styles.labelSm}>Filtrar por tipo</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
              className={styles.input}>
              <option value="">Todos los tipos</option>
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.campo}>
            <label className={styles.labelSm}>Filtrar por estado</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className={styles.input}>
              <option value="">Todos los estados</option>
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
            </select>
          </div>
        </div>

        {personal.length === 0 ? (
          <p className={styles.sinEsp}>No hay personal que coincida con estos filtros.</p>
        ) : (
          <ul className={styles.espLista}>
            {personal.map((p) => (
              <li key={p.personal_id} className={styles.espItem}>
                <div className={styles.espInfo}>
                  <span className={styles.espNombre}>
                    {p.nombre_completo} {p.activo ? '' : '· (inactivo)'}
                  </span>
                  <span className={styles.espDetalle}>
                    {etiquetaTipo(p.tipo)} · DNI {p.documento}
                    {p.sede     && ` · ${p.sede}`}
                    {p.telefono && ` · ☎ ${p.telefono}`}
                    {p.email    && ` · ${p.email}`}
                    {` · alta ${p.fechaAlta}`}
                  </span>
                </div>

                <div className={styles.confirmBtns}>
                  <button type="button" onClick={() => handleEditar(p)} className={styles.agregarBtn}>
                    Editar
                  </button>
                  <button type="button" onClick={() => handleEstado(p)} className={styles.cancelarBtn}>
                    {p.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button type="button" onClick={() => setConfirmarId(p.personal_id)}
                    className={styles.espQuitar} aria-label={`Eliminar el legajo de ${p.nombre_completo}`}>
                    ✕
                  </button>
                </div>

                {confirmarId === p.personal_id && (
                  <div className={styles.confirmBox}>
                    <p className={styles.confirmTexto}>
                      Se borra el legajo de <strong>{p.nombre_completo}</strong> de forma
                      definitiva. Si la persona dejó de trabajar acá, usá
                      «Desactivar»: conserva el registro.
                    </p>
                    <div className={styles.confirmBtns}>
                      <button type="button" onClick={() => handleEliminar(p)}
                        className={styles.confirmarEliminarBtn}>
                        Sí, eliminar
                      </button>
                      <button type="button" onClick={() => setConfirmarId(null)}
                        className={styles.cancelarBtn}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
