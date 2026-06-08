'use client';

import { useState }                                   from 'react';
import { EstadoBadge }                                from '@/components/ui/EstadoBadge';
import { CoberturasBadge }                            from '@/components/ui/Badge';
import { formatearFechaConAnio, formatearFechaCorta } from '@/lib/fecha';
import {
  confirmarPropuestaMedico,
  rechazarPropuestaMedico,
  solicitarCambioFecha,
} from '@/lib/api';

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
      className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">

        <div className="sm:w-28 shrink-0 text-center sm:text-left">
          <p className="text-2xl font-bold text-gray-900">{turno.hora} hs</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">
            {formatearFechaCorta(turno.fecha)}
          </p>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900">{turno.servicio.nombre}</p>
            <EstadoBadge estado={turno.estado} />
            {turno.cobertura && <CoberturasBadge cobertura={turno.cobertura} />}
          </div>
          <p className="text-sm text-gray-700 capitalize">{formatearFechaConAnio(turno.fecha)}</p>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p>👨‍⚕️ Dr/a. {turno.medico.nombre} <span className="text-gray-400">(Mat. {turno.medico.matricula})</span></p>
            {turno.sede && <p>📍 {turno.sede}</p>}
          </div>
        </div>

        <div className="sm:text-right shrink-0">
          {turno.montoAbonar === 0 && <p className="text-green-600 font-bold text-sm">Sin costo</p>}
          {turno.montoAbonar > 0  && <p className="text-gray-900 font-bold text-sm">${turno.montoAbonar.toLocaleString('es-AR')}</p>}
        </div>
      </div>

      {/* Propuesta del médico pendiente */}
      {turno.estado === 'propuesta_medico' && propuesta && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-700 mb-1">📅 El médico propuso un cambio de fecha</p>
          <p className="text-sm text-orange-600 mb-3">
            Nueva fecha: <strong>{formatearFecha(propuesta.nuevaFecha)}</strong> a las <strong>{propuesta.nuevaHora} hs</strong>
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleConfirmar}
              disabled={cargando}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {cargando ? 'Procesando...' : '✓ Confirmar'}
            </button>
            <button
              onClick={handleRechazar}
              disabled={cargando}
              className="px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {cargando ? 'Procesando...' : '✕ Rechazar'}
            </button>
          </div>
        </div>
      )}

      {/* Acciones para turno reservado */}
      {turno.estado === 'reservado' && (
        <div className="border-t border-gray-100 pt-3">
          {!mostrarFormCambio ? (
            <button
              onClick={() => setMostrarFormCambio(true)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              🗓 Solicitar cambio de fecha
            </button>
          ) : (
            <form onSubmit={handleSolicitarCambio} className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Proponer nueva fecha y hora</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor={`fecha-${turno.id}`} className="block text-xs text-gray-500 mb-1">Nueva fecha</label>
                  <input
                    id={`fecha-${turno.id}`}
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor={`hora-${turno.id}`} className="block text-xs text-gray-500 mb-1">Nueva hora</label>
                  <input
                    id={`hora-${turno.id}`}
                    type="time"
                    value={nuevaHora}
                    onChange={(e) => setNuevaHora(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={cargando}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {cargando ? 'Enviando...' : 'Enviar solicitud'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMostrarFormCambio(false); setError(''); }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}
    </article>
  );
}
