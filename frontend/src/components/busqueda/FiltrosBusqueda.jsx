'use client';

import { useState } from 'react';

const hoy = () => new Date().toISOString().split('T')[0];
const en30Dias = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

const initialState = () => ({
  especialidad: '',
  practica:     '',
  sede:         '',
  medicoId:     '',
  fechaDesde:   hoy(),
  fechaHasta:   en30Dias(),
  direccion:    'asc',
});

export default function FiltrosBusqueda({ onBuscar, cargando }) {
  const [filtros, setFiltros] = useState(initialState);

  const set = (campo) => (e) =>
    setFiltros((prev) => ({ ...prev, [campo]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v !== '')
    );
    onBuscar(params);
  };

  const handleReset = () => setFiltros(initialState);

  return (
    <form onSubmit={handleSubmit} aria-label="Filtros de búsqueda" className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 sticky top-20">
      <h2 className="font-semibold text-gray-900">Filtros</h2>

      <div className="space-y-3">
        <Campo id="especialidad" label="Especialidad" placeholder="Ej: Cardiología" value={filtros.especialidad} onChange={set('especialidad')} />
        <Campo id="practica"     label="Práctica"     placeholder="Ej: Electrocardiograma" value={filtros.practica}     onChange={set('practica')} />
        <Campo id="sede"         label="Sede"         placeholder="Ej: Sede Centro"         value={filtros.sede}         onChange={set('sede')} />
        <Campo id="medicoId"     label="ID Médico"    placeholder="Opcional"                value={filtros.medicoId}     onChange={set('medicoId')} type="number" />

        <div>
          <label htmlFor="fechaDesde" className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
          <input id="fechaDesde" type="date" value={filtros.fechaDesde} onChange={set('fechaDesde')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
        </div>

        <div>
          <label htmlFor="fechaHasta" className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
          <input id="fechaHasta" type="date" value={filtros.fechaHasta} onChange={set('fechaHasta')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
        </div>

        <div>
          <label htmlFor="direccion" className="block text-xs font-medium text-gray-600 mb-1">Ordenar</label>
          <select id="direccion" value={filtros.direccion} onChange={set('direccion')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none bg-white">
            <option value="asc">Fecha más cercana primero</option>
            <option value="desc">Fecha más lejana primero</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <button type="submit" disabled={cargando}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {cargando ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Buscando...
            </span>
          ) : 'Buscar turnos'}
        </button>
        <button type="button" onClick={handleReset}
          className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Limpiar filtros
        </button>
      </div>
    </form>
  );
}

function Campo({ id, label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none placeholder-gray-400" />
    </div>
  );
}
