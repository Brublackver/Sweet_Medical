import { useState }                              from 'react';
import { EstadoBadge }                           from '@/components/ui/EstadoBadge';
import { formatearFechaConAnio, formatearFechaCorta, formatearFecha } from '@/lib/fecha';
import {
  cancelarTurnoMedico,
  marcarRealizado,
  proponerCambio,
  confirmarCambioPaciente,
  rechazarCambioPaciente,
} from '@/lib/api';
import styles from '@/features/medico/Medico.module.css';

const yaPaso = (fecha, hora) => new Date(`${fecha}T${hora}:00`) <= new Date();

export default function TarjetaTurnoMedico({ turno, medicoId, onActualizar }) {
  const [cargando,       setCargando]        = useState(false);
  const [error,          setError]           = useState('');
  const [accionActiva,   setAccionActiva]    = useState(null);
  const [motivo,         setMotivo]          = useState('');
  const [nuevaFecha,     setNuevaFecha]      = useState('');
  const [nuevaHora,      setNuevaHora]       = useState('');

  const ejecutar = (accion, notificar = false) => {
    setError('');
    setCargando(true);
    accion()
      .then((t) => {
        if (notificar) window.dispatchEvent(new CustomEvent('notif-actualizada'));
        onActualizar(t);
        setAccionActiva(null);
        setMotivo('');
        setNuevaFecha('');
        setNuevaHora('');
      })
      .catch((e) => setError(e.response?.data?.message ?? 'Ocurrió un error. Intentá de nuevo.'))
      .finally(() => setCargando(false));
  };

  const handleCancelar = (e) => {
    e.preventDefault();
    if (!motivo.trim()) { setError('El motivo es obligatorio.'); return; }
    ejecutar(() => cancelarTurnoMedico(medicoId, turno.turno_id, motivo));
  };

  const handleMarcarRealizado = () =>
    ejecutar(() => marcarRealizado(medicoId, turno.turno_id));

  const handleProponerCambio = (e) => {
    e.preventDefault();
    if (!nuevaFecha || !nuevaHora) { setError('Completá la nueva fecha y hora.'); return; }
    ejecutar(() => proponerCambio(medicoId, turno.turno_id, nuevaFecha, nuevaHora));
  };

  const handleConfirmarCambio = () =>
    ejecutar(() => confirmarCambioPaciente(medicoId, turno.turno_id), true);

  const handleRechazarCambio = () =>
    ejecutar(() => rechazarCambioPaciente(medicoId, turno.turno_id), true);

  const paciente  = turno.snapshotPaciente;
  const medico    = turno.snapshotMedico;
  const solicitud = turno.solicitudCambioFecha;
  const activo    = ['reservado', 'pendiente_cambio', 'propuesta_medico'].includes(turno.estado);

  return (
    <article className={styles.tarjeta}>
      <div className={styles.tarjetaBody}>
        <div className={styles.tarjetaHora}>
          <p className={styles.horaNum}>{turno.hora} hs</p>
          <p className={styles.horaFecha}>{formatearFechaCorta(turno.fecha)}</p>
        </div>

        <div className={styles.tarjetaInfo}>
          <div className={styles.tarjetaBadges}>
            <p className={styles.tarjetaNombre}>
              {paciente ? paciente.nombre : `Paciente #${turno.paciente_id}`}
            </p>
            <EstadoBadge estado={turno.estado} />
          </div>
          <p className={styles.tarjetaFecha}>{formatearFechaConAnio(turno.fecha)}</p>
          <p className={styles.tarjetaDetalle}>
            Duración: {turno.duracion} min
            {medico && medico.especialidades?.length > 0 && (
              <span className={styles.tarjetaSecundario}> · {medico.especialidades[0].nombre}</span>
            )}
          </p>
          {paciente?.obraSocial && (
            <p className={styles.tarjetaObraSocial}>Obra social: {paciente.obraSocial}</p>
          )}
        </div>
      </div>

      {turno.estado === 'pendiente_cambio' && solicitud && (
        <div className={styles.solicitudBox}>
          <p className={styles.solicitudTitulo}>⟳ El paciente solicitó un cambio de fecha</p>
          <p className={styles.solicitudTexto}>
            Nueva fecha propuesta: <strong>{formatearFecha(solicitud.nuevaFecha)}</strong> a las <strong>{solicitud.nuevaHora} hs</strong>
          </p>
          <div className={styles.acciones}>
            <button onClick={handleConfirmarCambio} disabled={cargando} className={styles.btnVerde}>
              {cargando ? 'Procesando...' : '✓ Confirmar cambio'}
            </button>
            <button onClick={handleRechazarCambio} disabled={cargando} className={styles.btnRojo}>
              {cargando ? 'Procesando...' : '✕ Rechazar cambio'}
            </button>
          </div>
        </div>
      )}

      {activo && accionActiva === null && (
        <div className={styles.divisor}>
          {turno.estado === 'reservado' && yaPaso(turno.fecha, turno.hora) && (
            <button onClick={handleMarcarRealizado} disabled={cargando} className={styles.btnVerdePeq}>
              ✓ Marcar realizado
            </button>
          )}
          {turno.estado === 'reservado' && (
            <button onClick={() => setAccionActiva('proponer')} className={styles.btnAzulPeq}>
              🗓 Proponer cambio
            </button>
          )}
          <button onClick={() => setAccionActiva('cancelar')} className={styles.btnRojoPeq}>
            Cancelar turno
          </button>
        </div>
      )}

      {accionActiva === 'cancelar' && (
        <form onSubmit={handleCancelar} className={styles.form}>
          <p className={styles.formTitulo}>Motivo de cancelación</p>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: El médico no podrá asistir ese día"
            rows={2}
            className={styles.textarea}
          />
          <div className={styles.formAcciones}>
            <button type="submit" disabled={cargando} className={styles.btnEnviarRojo}>
              {cargando ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
            <button
              type="button"
              onClick={() => { setAccionActiva(null); setError(''); }}
              className={styles.btnVolver}
            >
              Volver
            </button>
          </div>
        </form>
      )}

      {accionActiva === 'proponer' && (
        <form onSubmit={handleProponerCambio} className={styles.form}>
          <p className={styles.formTitulo}>Proponer nueva fecha y hora al paciente</p>
          <div className={styles.formInputs}>
            <div>
              <label className={styles.campoLabel}>Nueva fecha</label>
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.campoLabel}>Nueva hora</label>
              <input
                type="time"
                value={nuevaHora}
                onChange={(e) => setNuevaHora(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>
          <div className={styles.formAcciones}>
            <button type="submit" disabled={cargando} className={styles.btnEnviar}>
              {cargando ? 'Enviando...' : 'Enviar propuesta'}
            </button>
            <button
              type="button"
              onClick={() => { setAccionActiva(null); setError(''); }}
              className={styles.btnVolver}
            >
              Volver
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className={styles.errorInline}>⚠️ {error}</p>
      )}
    </article>
  );
}
