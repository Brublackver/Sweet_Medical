'use client';

import { useState, useEffect }  from 'react';
import { useRouter }            from 'next/navigation';
import { useMedico }            from '@/context/MedicoContext';
import { formatearFechaConAnio } from '@/lib/fecha';
import { getDisponibilidad, definirDisponibilidad, eliminarDisponibilidad } from '@/lib/api';

export default function DisponibilidadPage() {
  const { medico }                     = useMedico();
  const router                         = useRouter();
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [cargando,  setCargando]       = useState(true);
  const [error,     setError]          = useState('');
  const [guardando, setGuardando]      = useState(false);
  const [errorForm, setErrorForm]      = useState('');

  const [fecha,     setFecha]          = useState('');
  const [horaDesde, setHoraDesde]      = useState('');
  const [horaHasta, setHoraHasta]      = useState('');

  const cargar = () => {
    if (!medico) return;
    getDisponibilidad(medico.medico_id)
      .then(setDisponibilidades)
      .catch(() => setError('No pudimos cargar la disponibilidad.'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (medico === null) { router.replace('/login'); return; }
    cargar();
  }, [medico, router]);

  if (!medico) return null;

  const handleAgregar = (e) => {
    e.preventDefault();
    setErrorForm('');
    if (!fecha || !horaDesde || !horaHasta) { setErrorForm('Completá todos los campos.'); return; }
    if (horaDesde >= horaHasta) { setErrorForm('La hora de inicio debe ser anterior a la hora de fin.'); return; }
    setGuardando(true);
    definirDisponibilidad(medico.medico_id, { fecha, horaDesde, horaHasta })
      .then((data) => {
        setDisponibilidades(data);
        setFecha(''); setHoraDesde(''); setHoraHasta('');
      })
      .catch((e) => setErrorForm(e.response?.data?.message ?? 'Error al guardar.'))
      .finally(() => setGuardando(false));
  };

  const handleEliminar = (disponibilidadId) => {
    eliminarDisponibilidad(medico.medico_id, disponibilidadId)
      .then(() => setDisponibilidades((prev) => prev.filter((d) => d.disponibilidad_id !== disponibilidadId)))
      .catch(() => setError('No se pudo eliminar la disponibilidad.'));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi disponibilidad</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Configurá los días y horarios en que podés atender pacientes.
        </p>
      </header>

      {/* Formulario agregar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Agregar disponibilidad</h2>
        <form onSubmit={handleAgregar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="disp-fecha" className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
              <input id="disp-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label htmlFor="disp-desde" className="block text-xs font-medium text-gray-600 mb-1">Hora desde</label>
              <input id="disp-desde" type="time" value={horaDesde} onChange={(e) => setHoraDesde(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label htmlFor="disp-hasta" className="block text-xs font-medium text-gray-600 mb-1">Hora hasta</label>
              <input id="disp-hasta" type="time" value={horaHasta} onChange={(e) => setHoraHasta(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
            </div>
          </div>

          {errorForm && (
            <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">⚠️ {errorForm}</p>
          )}

          <button type="submit" disabled={guardando}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {guardando ? 'Guardando...' : '+ Agregar disponibilidad'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <h2 className="font-semibold text-gray-900 mb-4">Disponibilidad actual</h2>

      {cargando && <p className="text-sm text-gray-400">Cargando...</p>}

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {!cargando && !error && disponibilidades.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3" aria-hidden="true">🗓</p>
          <p className="text-gray-500 text-sm">No tenés disponibilidad cargada todavía.</p>
        </div>
      )}

      {!cargando && disponibilidades.length > 0 && (
        <div className="space-y-2">
          {disponibilidades
            .slice()
            .sort((a, b) => a.fecha.localeCompare(b.fecha))
            .map((d) => (
              <div key={d.disponibilidad_id ?? d.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">{formatearFechaConAnio(d.fecha)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{d.horaDesde} hs — {d.horaHasta} hs</p>
                </div>
                <button
                  onClick={() => handleEliminar(d.disponibilidad_id ?? d.id)}
                  aria-label={`Eliminar disponibilidad del ${d.fecha}`}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors underline shrink-0"
                >
                  Eliminar
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
