import { useState }                                   from 'react';
import { EstadoBadge }                                from '@/components/ui/EstadoBadge';
import { CoberturasBadge }                            from '@/components/ui/Badge';
import { formatearFechaConAnio, formatearFechaCorta, formatearFecha } from '@/lib/fecha';
import {
  confirmarPropuestaMedico,
  rechazarPropuestaMedico,
  solicitarCambioFecha,
} from '@/lib/api';
import styles from './MisTurnos.module.css';

export default function TarjetaMiTurno({ turno, pacienteId, onActualizar }) {
  const [cargando,       setCargando]       = useState(false);
  const [error,          setError]          = useState('');
  const [mostrarFormCambio, setMostrarFormCambio] = useState(false);
  const [nuevaFecha,     setNuevaFecha]     = useState('');
  const [nuevaHora,      setNuevaHora]      = useState('');

  const ejecutar = (accion) => {
    setError('');
    setCargando(true);
    accion()
      .then(onActualizar)
      .catch((e) => setError(e.response?.data?.message ?? 'Ocurrió un error. Intentá de nuevo.'))
      .finally(() => setCargando(false));
  };

  const handleConfirmar = () =>
    ejecutar(() => confirmarPropuestaMedico(pacienteId, turno.id));

  const handleRechazar = () =>
    ejecutar(() => rechazarPropuestaMedico(pacienteId, turno.id));

  const handleSolicitarCambio = (e) => {
    e.preventDefault();
    if (!nuevaFecha || !nuevaHora) { setError('Completá la nueva fecha y hora.'); return; }
    ejecutar(() => solicitarCambioFecha(pacienteId, turno.id, nuevaFecha, nuevaHora));
    setMostrarFormCambio(false);
  };

  const propuesta = turno.propuestaMedicoFecha;

  return (
    <article
      aria-label={`Turno de ${turno.servicio.nombre} el ${turno.fecha}`}
      className={styles.tarjeta}
    >
      <div className={styles.tarjetaBody}>
        <div className={styles.tarjetaHora}>
          <p className={styles.horaNum}>{turno.hora} hs</p>
          <p className={styles.horaFecha}>{formatearFechaCorta(turno.fecha)}</p>
        </div>

        <div className={styles.tarjetaInfo}>
          <div className={styles.tarjetaBadges}>
            <p className={styles.tarjetaNombre}>{turno.servicio.nombre}</p>
            <EstadoBadge estado={turno.estado} />
            {turno.cobertura && <CoberturasBadge cobertura={turno.cobertura} />}
          </div>
          <p className={styles.tarjetaFechaLarga}>{formatearFechaConAnio(turno.fecha)}</p>
          <div className={styles.tarjetaDetalle}>
            <p>👨‍⚕️ Dr/a. {turno.medico.nombre} <span className={styles.tarjetaSecundario}>(Mat. {turno.medico.matricula})</span></p>
            {turno.sede && <p>📍 {turno.sede}</p>}
          </div>
        </div>

        <div className={styles.tarjetaPrecio}>
          {turno.montoAbonar === 0 && <p className={styles.precioGratis}>Sin costo</p>}
          {turno.montoAbonar > 0  && <p className={styles.precioMonto}>${turno.montoAbonar.toLocaleString('es-AR')}</p>}
        </div>
      </div>

      {turno.estado === 'propuesta_medico' && propuesta && (
        <div className={styles.propuestaBox}>
          <p className={styles.propuestaTitulo}>📅 El médico propuso un cambio de fecha</p>
          <p className={styles.propuestaTexto}>
            Nueva fecha: <strong>{formatearFecha(propuesta.nuevaFecha)}</strong> a las <strong>{propuesta.nuevaHora} hs</strong>
          </p>
          <div className={styles.acciones}>
            <button
              onClick={handleConfirmar}
              disabled={cargando}
              className={styles.btnConfirmar}
            >
              {cargando ? 'Procesando...' : '✓ Confirmar'}
            </button>
            <button
              onClick={handleRechazar}
              disabled={cargando}
              className={styles.btnRechazar}
            >
              {cargando ? 'Procesando...' : '✕ Rechazar'}
            </button>
          </div>
        </div>
      )}

      {turno.estado === 'reservado' && (
        <div className={styles.divisor}>
          {!mostrarFormCambio ? (
            <button
              onClick={() => setMostrarFormCambio(true)}
              className={styles.linkCambio}
            >
              🗓 Solicitar cambio de fecha
            </button>
          ) : (
            <form onSubmit={handleSolicitarCambio} className={styles.formCambio}>
              <p className={styles.formCambioTitulo}>Proponer nueva fecha y hora</p>
              <div className={styles.formCambioInputs}>
                <div>
                  <label htmlFor={`fecha-${turno.id}`} className={styles.campoLabel}>Nueva fecha</label>
                  <input
                    id={`fecha-${turno.id}`}
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div>
                  <label htmlFor={`hora-${turno.id}`} className={styles.campoLabel}>Nueva hora</label>
                  <input
                    id={`hora-${turno.id}`}
                    type="time"
                    value={nuevaHora}
                    onChange={(e) => setNuevaHora(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>
              <div className={styles.formCambioAcciones}>
                <button type="submit" disabled={cargando} className={styles.btnEnviar}>
                  {cargando ? 'Enviando...' : 'Enviar solicitud'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMostrarFormCambio(false); setError(''); }}
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className={styles.errorInline}>⚠️ {error}</p>
      )}
    </article>
  );
}
