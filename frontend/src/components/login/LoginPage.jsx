'use client';

import { useState, useEffect } from 'react';
import { useRouter }             from 'next/navigation';
import { usePaciente }           from '@/context/PacienteContext';
import { useMedico }             from '@/context/MedicoContext';
import { getPaciente, getMedico } from '@/lib/api';

export default function LoginPage() {
  const { paciente, login: loginPaciente } = usePaciente();
  const { medico,   login: loginMedico }   = useMedico();
  const router                             = useRouter();
  const [rol, setRol]                      = useState('paciente');
  const [id, setId]                        = useState('');
  const [cargando, setCargando]            = useState(false);
  const [error, setError]                  = useState('');

  useEffect(() => {
    if (paciente) { router.replace('/buscar'); return; }
    if (medico)   { router.replace('/medico/turnos'); }
  }, [paciente, medico, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      setError('Ingresá un ID numérico válido.');
      return;
    }
    setCargando(true);
    const entidad = rol === 'paciente' ? 'paciente' : 'médico';
    const peticion = rol === 'paciente'
      ? getPaciente(numId).then((data) => { loginPaciente(data); router.push('/buscar'); })
      : getMedico(numId).then((data)   => { loginMedico(data);   router.push('/medico/turnos'); });
    peticion
      .catch((err) => setError(
        err.response?.status === 404
          ? `No encontramos un ${entidad} con ese ID. Verificá el número.`
          : 'Ocurrió un error al conectar con el servidor. Intentá de nuevo.'
      ))
      .finally(() => setCargando(false));
  };

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo — solo desktop */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative">
          <div className="text-4xl mb-4">🏥</div>
          <h1 className="text-white text-3xl font-bold leading-tight">Sweet Medical</h1>
          <p className="text-blue-200 mt-2 text-base">Sistema de gestión de turnos médicos</p>
        </div>

        <div className="relative space-y-6">
          {[
            { icon: '📅', titulo: 'Turnos online', desc: 'Solicitá turnos desde cualquier lugar, en cualquier momento.' },
            { icon: '👨‍⚕️', titulo: 'Gestión médica', desc: 'Los médicos administran su agenda de forma sencilla.' },
            { icon: '🔔', titulo: 'Seguimiento', desc: 'Confirmaciones y cambios de fecha en tiempo real.' },
          ].map(({ icon, titulo, desc }) => (
            <div key={titulo} className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">{icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{titulo}</p>
                <p className="text-blue-200 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative text-blue-300 text-xs">© 2026 Sweet Medical</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm">

          {/* Header mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-3" aria-hidden="true">🏥</div>
            <h1 className="text-2xl font-bold text-gray-900">Sweet Medical</h1>
            <p className="text-gray-500 mt-1 text-sm">Sistema de gestión de turnos médicos</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Bienvenido</h2>
              <p className="text-gray-500 text-sm mt-1">Seleccioná tu rol e ingresá tu ID</p>
            </div>

            {/* Toggle rol */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-6" role="group" aria-label="Tipo de usuario">
              {['paciente', 'medico'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRol(r); setId(''); setError(''); }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    rol === r
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {r === 'paciente' ? '👤 Paciente' : '👨‍⚕️ Médico'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white text-base"
                />
              </div>

              {error && (
                <div id="login-error" role="alert" className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <span aria-hidden="true">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={cargando || !id.trim()}
                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
              >
                {cargando ? 'Verificando...' : 'Ingresar →'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Tu ID te lo brinda la administración del centro médico.
          </p>
        </div>
      </div>
    </div>
  );
}
