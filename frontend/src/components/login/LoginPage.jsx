'use client';

import { useState, useEffect } from 'react';
import { useRouter }    from 'next/navigation';
import { usePaciente }  from '@/context/PacienteContext';
import { useMedico }    from '@/context/MedicoContext';
import { getPaciente, getMedico } from '@/lib/api';

export default function LoginPage() {
  const { paciente, login }         = usePaciente();
  const { medico,   loginMedico }   = useMedico();
  const router                      = useRouter();
  const [rol, setRol]               = useState('paciente');
  const [id, setId]                 = useState('');
  const [cargando, setCargando]     = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (paciente) { router.replace('/buscar'); return; }
    if (medico)   { router.replace('/medico/turnos'); }
  }, [paciente, medico, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      setError('Ingresá un ID numérico válido.');
      return;
    }
    setCargando(true);
    try {
      if (rol === 'paciente') {
        const data = await getPaciente(numId);
        login(data);
        router.push('/buscar');
      } else {
        const data = await getMedico(numId);
        loginMedico(data);
        router.push('/medico/turnos');
      }
    } catch (err) {
      const entidad = rol === 'paciente' ? 'paciente' : 'médico';
      setError(
        err.response?.status === 404
          ? `No encontramos un ${entidad} con ese ID. Verificá el número.`
          : 'Ocurrió un error al conectar con el servidor. Intentá de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-6xl mb-4" aria-hidden="true">🏥</div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sweet Medical</h1>
          <p className="mt-2 text-gray-500">Ingresá para acceder al sistema</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* Toggle Paciente / Médico */}
          <div className="flex rounded-xl border border-gray-200 p-1 mb-6 bg-gray-50" role="group" aria-label="Tipo de usuario">
            {['paciente', 'medico'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRol(r); setId(''); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  rol === r
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r === 'paciente' ? '👤 Paciente' : '👨‍⚕️ Médico'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1.5">
                {rol === 'paciente' ? 'ID de Paciente' : 'ID de Médico'}
              </label>
              <input
                id="userId"
                type="number"
                min="1"
                inputMode="numeric"
                value={id}
                onChange={(e) => { setId(e.target.value); setError(''); }}
                placeholder="Ej: 1"
                autoFocus
                aria-describedby={error ? 'login-error' : undefined}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-gray-900 placeholder-gray-400 text-base"
              />
            </div>

            {error && (
              <div id="login-error" role="alert" className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span aria-hidden="true">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando || !id.trim()}
              className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Tu ID te lo brinda la administración del centro médico.
        </p>
      </div>
    </div>
  );
}
