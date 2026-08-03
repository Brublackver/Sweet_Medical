'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getAllObrasSociales, crearObraSocial, registrarSuscripcion,
  cambiarEstadoSuscripcion, cambiarEstadoObraSocial,
} from '@/lib/api';
import styles from '@/features/admin/AdminPage.module.css';

/*
  ObrasSocialesTab — catálogo y suscripciones.

  Ojo con no confundir los dos estados que se manejan acá, porque son distintos:

    · La OBRA SOCIAL activa/inactiva → si sigue en el catálogo.
    · La SUSCRIPCIÓN vigente         → si el contrato con la clínica está al día.

  Una obra social puede estar activa con la suscripción vencida. Por eso hay dos
  interruptores separados y no uno solo.

  Los PLANES (110, Gold, ...) no se editan desde acá: son datos maestros que
  vienen del código y definen la cobertura del paciente, no el contrato.
*/

const SUSCRIPCION_VACIA = {
  modalidad: 'ESTANDAR',
  fechaInicio: '',
  fechaVencimiento: '',
  contacto: '',
  observaciones: '',
};

export default function ObrasSocialesTab() {
  const [obrasSociales, setObrasSociales] = useState([]);
  const [nombreNueva, setNombreNueva]     = useState('');
  const [editandoId, setEditandoId]       = useState(null);
  const [suscripcion, setSuscripcion]     = useState(SUSCRIPCION_VACIA);
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [claveNueva, setClaveNueva]       = useState('');
  const [valorNuevo, setValorNuevo]       = useState('');
  const [filtro, setFiltro]               = useState('');
  const [cargando, setCargando]           = useState(false);
  const [exito, setExito]                 = useState('');
  const [error, setError]                 = useState('');

  const cargar = useCallback(() => {
    const filtros = {};
    if (filtro === 'activas')     filtros.activa  = true;
    if (filtro === 'inactivas')   filtros.activa  = false;
    if (filtro === 'vigentes')    filtros.vigente = true;
    if (filtro === 'no-vigentes') filtros.vigente = false;

    getAllObrasSociales(filtros)
      .then(setObrasSociales)
      .catch(() => setError('No se pudo cargar el catálogo de obras sociales.'));
  }, [filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const set = (campo) => (e) => {
    setSuscripcion((prev) => ({ ...prev, [campo]: e.target.value }));
    setError('');
  };

  const limpiarEdicion = () => {
    setEditandoId(null);
    setSuscripcion(SUSCRIPCION_VACIA);
    setCaracteristicas([]);
    setClaveNueva('');
    setValorNuevo('');
  };

  const handleCrearObraSocial = (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    crearObraSocial({ nombre: nombreNueva.trim(), planes: [] })
      .then((creada) => {
        setExito(`Obra social creada: ${creada.nombre} (ID ${creada.obra_social_id})`);
        setNombreNueva('');
        cargar();
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo crear la obra social.'))
      .finally(() => setCargando(false));
  };

  const handleGestionar = (os) => {
    setEditandoId(os.obra_social_id);
    setExito('');
    setError('');
    setSuscripcion({
      modalidad:        os.suscripcion?.modalidad        ?? 'ESTANDAR',
      fechaInicio:      os.suscripcion?.fechaInicio      ?? '',
      fechaVencimiento: os.suscripcion?.fechaVencimiento ?? '',
      contacto:         os.suscripcion?.contacto         ?? '',
      observaciones:    os.suscripcion?.observaciones    ?? '',
    });
    setCaracteristicas(os.suscripcion?.caracteristicas ?? []);
  };

  const handleGuardarSuscripcion = (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    // Las fechas vacías viajan como null: "sin vencimiento" es un dato válido
    // (contrato sin fecha de corte), no un campo mal cargado.
    registrarSuscripcion(editandoId, {
      modalidad:        suscripcion.modalidad.trim() || 'ESTANDAR',
      fechaInicio:      suscripcion.fechaInicio      || null,
      fechaVencimiento: suscripcion.fechaVencimiento || null,
      contacto:         suscripcion.contacto.trim()      || null,
      observaciones:    suscripcion.observaciones.trim() || null,
      caracteristicas,
    })
      .then((guardada) => {
        setExito(`Suscripción de ${guardada.nombre} guardada.`);
        limpiarEdicion();
        cargar();
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo guardar la suscripción.'))
      .finally(() => setCargando(false));
  };

  const handleEstadoSuscripcion = (os) => {
    const activar = os.suscripcion?.estado !== 'ACTIVA';
    setError('');
    cambiarEstadoSuscripcion(os.obra_social_id, activar)
      .then(() => {
        setExito(`Suscripción de ${os.nombre} ${activar ? 'activada' : 'suspendida'}.`);
        cargar();
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cambiar el estado de la suscripción.'));
  };

  const handleEstadoObraSocial = (os) => {
    setError('');
    cambiarEstadoObraSocial(os.obra_social_id, !os.activa)
      .then(() => {
        setExito(`${os.nombre} quedó ${os.activa ? 'inactiva' : 'activa'} en el catálogo.`);
        cargar();
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cambiar el estado.'));
  };

  const agregarCaracteristica = () => {
    if (!claveNueva.trim() || !valorNuevo.trim()) return;
    setCaracteristicas((prev) => [
      ...prev.filter((c) => c.clave !== claveNueva.trim()),
      { clave: claveNueva.trim(), valor: valorNuevo.trim() },
    ]);
    setClaveNueva('');
    setValorNuevo('');
  };

  const quitarCaracteristica = (clave) =>
    setCaracteristicas((prev) => prev.filter((c) => c.clave !== clave));

  const editando = obrasSociales.find((o) => o.obra_social_id === editandoId) ?? null;

  return (
    <div>
      {/* ====== ALTA ====== */}
      <form onSubmit={handleCrearObraSocial} noValidate className={styles.form}>
        <h2 className={styles.formTitulo}>Registrar obra social</h2>

        {exito && <div className={styles.exito}><span>✅</span><span>{exito}</span></div>}
        {error && <div className={styles.error}><span>⚠️</span><span>{error}</span></div>}

        <div className={styles.campo}>
          <label className={styles.label}>Nombre</label>
          <input type="text" value={nombreNueva} required className={styles.input}
            placeholder="Ej: Galeno"
            onChange={(e) => { setNombreNueva(e.target.value); setError(''); }} />
        </div>

        <p className={styles.sinEsp}>
          Los planes de cobertura son datos maestros del sistema y no se cargan
          desde acá. La suscripción se gestiona una vez creada la obra social.
        </p>

        <button type="submit" className={styles.submitBtn} disabled={cargando || !nombreNueva.trim()}>
          {cargando ? 'Creando...' : 'Crear obra social →'}
        </button>
      </form>

      {/* ====== SUSCRIPCIÓN ====== */}
      {editando && (
        <form onSubmit={handleGuardarSuscripcion} noValidate className={styles.form}>
          <h2 className={styles.formTitulo}>Suscripción · {editando.nombre}</h2>

          <div className={styles.espFormGrid}>
            <div className={styles.campo}>
              <label className={styles.label}>Modalidad</label>
              <input type="text" value={suscripcion.modalidad} onChange={set('modalidad')}
                className={styles.input} placeholder="Ej: ESTANDAR / PREMIUM" />
            </div>
            <div className={styles.campo}>
              <label className={styles.label}>
                Contacto <span className={styles.opcional}>(opcional)</span>
              </label>
              <input type="text" value={suscripcion.contacto} onChange={set('contacto')}
                className={styles.input} placeholder="Ej: convenios@galeno.com" />
            </div>
          </div>

          <div className={styles.espFormGrid}>
            <div className={styles.campo}>
              <label className={styles.label}>Inicio</label>
              <input type="date" value={suscripcion.fechaInicio} onChange={set('fechaInicio')}
                className={styles.input} />
            </div>
            <div className={styles.campo}>
              <label className={styles.label}>
                Vencimiento <span className={styles.opcional}>(vacío = sin vencimiento)</span>
              </label>
              <input type="date" value={suscripcion.fechaVencimiento} onChange={set('fechaVencimiento')}
                className={styles.input} />
            </div>
          </div>

          <div className={styles.campo}>
            <label className={styles.label}>
              Observaciones <span className={styles.opcional}>(opcional)</span>
            </label>
            <input type="text" value={suscripcion.observaciones} onChange={set('observaciones')}
              className={styles.input} placeholder="Ej: renovación automática" />
          </div>

          {/* Condiciones extensibles: acá entran topes, copagos o lo que venga
              mañana, sin tocar el modelo de datos. */}
          <div className={styles.seccionEsp}>
            <h3 className={styles.labelSubseccion}>Condiciones de la suscripción</h3>

            {caracteristicas.length === 0 ? (
              <p className={styles.sinEsp}>Sin condiciones cargadas.</p>
            ) : (
              <ul className={styles.espLista}>
                {caracteristicas.map((c) => (
                  <li key={c.clave} className={styles.espItem}>
                    <div className={styles.espInfo}>
                      <span className={styles.espNombre}>{c.clave}</span>
                      <span className={styles.espDetalle}>{c.valor}</span>
                    </div>
                    <button type="button" onClick={() => quitarCaracteristica(c.clave)}
                      className={styles.espQuitar} aria-label={`Quitar la condición ${c.clave}`}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.cobFormGrid}>
              <div className={styles.campo}>
                <label className={styles.labelSm}>Condición</label>
                <input type="text" value={claveNueva} onChange={(e) => setClaveNueva(e.target.value)}
                  className={styles.input} placeholder="Ej: tope_mensual" />
              </div>
              <div className={styles.campo}>
                <label className={styles.labelSm}>Valor</label>
                <input type="text" value={valorNuevo} onChange={(e) => setValorNuevo(e.target.value)}
                  className={styles.input} placeholder="Ej: 150000" />
              </div>
              <button type="button" onClick={agregarCaracteristica} className={styles.agregarBtn}>
                Agregar
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar suscripción →'}
          </button>
          <button type="button" onClick={limpiarEdicion} className={styles.cancelarBtn}>
            Cerrar
          </button>
        </form>
      )}

      {/* ====== LISTADO ====== */}
      <div className={styles.seccionEsp}>
        <h3 className={styles.seccionEspTitulo}>Obras sociales ({obrasSociales.length})</h3>

        <div className={styles.campo}>
          <label className={styles.labelSm}>Filtrar</label>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className={styles.input}>
            <option value="">Todas</option>
            <option value="activas">Activas en el catálogo</option>
            <option value="inactivas">Inactivas en el catálogo</option>
            <option value="vigentes">Con suscripción vigente</option>
            <option value="no-vigentes">Sin suscripción vigente</option>
          </select>
        </div>

        {obrasSociales.length === 0 ? (
          <p className={styles.sinEsp}>No hay obras sociales que coincidan con este filtro.</p>
        ) : (
          <ul className={styles.espLista}>
            {obrasSociales.map((os) => (
              <li key={os.obra_social_id} className={styles.espItem}>
                <div className={styles.espInfo}>
                  <span className={styles.espNombre}>
                    {os.nombre} {os.activa ? '' : '· (inactiva)'}
                  </span>
                  <span className={styles.espDetalle}>
                    {os.planes.length} {os.planes.length === 1 ? 'plan' : 'planes'}
                    {' · '}
                    {!os.suscripcion
                      ? 'sin suscripción'
                      : `suscripción ${os.suscripcion.modalidad} — ${
                          os.suscripcion_vigente ? 'vigente' : 'no vigente'
                        }${os.suscripcion.fechaVencimiento ? ` (vence ${os.suscripcion.fechaVencimiento})` : ''}`}
                  </span>
                </div>

                <div className={styles.confirmBtns}>
                  <button type="button" onClick={() => handleGestionar(os)} className={styles.agregarBtn}>
                    {os.suscripcion ? 'Editar suscripción' : 'Dar de alta suscripción'}
                  </button>
                  {os.suscripcion && (
                    <button type="button" onClick={() => handleEstadoSuscripcion(os)}
                      className={styles.cancelarBtn}>
                      {os.suscripcion.estado === 'ACTIVA' ? 'Suspender' : 'Reactivar'}
                    </button>
                  )}
                  <button type="button" onClick={() => handleEstadoObraSocial(os)}
                    className={styles.cancelarBtn}>
                    {os.activa ? 'Dar de baja' : 'Dar de alta'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
