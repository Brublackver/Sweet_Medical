'use client';

import { useState }                              from 'react';
import { EstadoBadge }                           from '@/components/ui/EstadoBadge';
import { formatearFechaConAnio, formatearFechaCorta } from '@/lib/fecha';
import {
  cancelarTurnoMedico,
  marcarRealizado,
  proponerCambio,
  confirmarCambioPaciente,
  rechazarCambioPaciente,
} from '@/lib/api';

const yaPaso = (fecha, hora) => new Date(`${fecha}T${hora}:00`) <= new Date();

export default function TarjetaTurnoMedico({ turno, medicoId, onActualizar }) {
  const [cargando,       setCargando]        = useState(false);
  const [error,          setError]           = useState('');
  const [accionActiva,   setAccionActiva]    = useState(null); // 'cancelar' | 'proponer'
  const [motivo,         setMotivo]          = useState('');
  const [nuevaFecha,     setNuevaFecha]      = useState('');
  const [nuevaHora,      setNuevaHora]       = useState('');

  const ejecutar = (accion) => {
    setError('');
    setCargando(true);
    accion()
      .then((t) => { onActualizar(t); setAccionActiva(null); setMotivo(''); setNuevaFecha(''); setNuevaHora(''); })
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
    ejecutar(() => confirmarCambioPaciente(medicoId, turno.turno_id));

  const handleRechazarCambio = () =>
    ejecutar(() => rechazarCambioPaciente(medicoId, turno.turno_id));

  const paciente  = turno.snapshotPaciente;
  const medico    = turno.snapshotMedico;
  const solicitud = turno.solicitudCambioFecha;
  const activo    = ['reservado', 'pendiente_cambio', 'propuesta_medico'].includes(turno.estado);

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="sm:w-28 shrink-0 text-center sm:text-left">
          <p className="text-2xl font-bold text-gray-900">{turno.hora} hs</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">
            {formatearFechaCorta(turno.fecha)}
          </p>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900">
              {paciente ? paciente.nombre : `Paciente #${turno.paciente_id}`}
            </p>
            <EstadoBadge estado={turno.estado} />
          </div>
          <p className="text-sm text-gray-700 capitalize">{formatearFechaConAnio(turno.fecha)}</p>
          <p className="text-sm text-gray-500">
            Duración: {turno.duracion} min
            {medico && medico.especialidades?.length > 0 && (
              <span className="ml-2">· {medico.especialidades[0].nombre}</span>
            )}
          </p>
          {paciente?.obraSocial && (
            <p className="text-xs text-gray-400">Obra social: {paciente.obraSocial}</p>
          )}
        </div>
      </div>

      {/* El paciente solicitó un cambio */}
      {turno.estado === 'pendiente_cambio' && solicitud && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-700 mb-1">⟳ El paciente solicitó un cambio de fecha</p>
          <p className="text-sm text-yellow-600 mb-3">
            Nueva fecha propuesta: <strong>{formatearFecha(solicitud.nuevaFecha)}</strong> a las <strong>{solicitud.nuevaHora} hs</strong>
          </p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleConfirmarCambio} disabled={cargando}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {cargando ? 'Procesando...' : '✓ Confirmar cambio'}
            </button>
            <button onClick={handleRechazarCambio} disabled={cargando}
              className="px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
              {cargando ? 'Procesando...' : '✕ Rechazar cambio'}
            </button>
          </div>
        </div>
      )}

      {/* Acciones principales */}
      {activo && accionActiva === null && (
        <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-2">
          {turno.estado === 'reservado' && yaPaso(turno.fecha, turno.hora) && (
            <button onClick={handleMarcarRealizado} disabled={cargando}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              ✓ Marcar realizado
            </button>
          )}
          {turno.estado === 'reservado' && (
            <button onClick={() => setAccionActiva('proponer')}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors">
              🗓 Proponer cambio
            </button>
          )}
          <button onClick={() => setAccionActiva('cancelar')}
            className="px-3 py-1.5 bg-white border border-red-200 text-red-500 text-sm rounded-lg hover:bg-red-50 transition-colors">
            Cancelar turno
          </button>
        </div>
      )}

      {/* Form cancelar */}
      {accionActiva === 'cancelar' && (
        <form onSubmit={handleCancelar} className="border-t border-gray-100 pt-3 space-y-3">
          <p className="text-sm font-medium text-gray-700">Motivo de cancelación</p>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: El médico no podrá asistir ese día"
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none resize-none"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={cargando}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              {cargando ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
            <button type="button" onClick={() => { setAccionActiva(null); setError(''); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Volver
            </button>
          </div>
        </form>
      )}

      {/* Form proponer cambio */}
      {accionActiva === 'proponer' && (
        <form onSubmit={handleProponerCambio} className="border-t border-gray-100 pt-3 space-y-3">
          <p className="text-sm font-medium text-gray-700">Proponer nueva fecha y hora al paciente</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Nueva fecha</label>
              <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Nueva hora</label>
              <input type="time" value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={cargando}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {cargando ? 'Enviando...' : 'Enviar propuesta'}
            </button>
            <button type="button" onClick={() => { setAccionActiva(null); setError(''); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Volver
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}
    </article>
  );
}
