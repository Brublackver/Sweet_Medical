'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePaciente } from '@/context/PacienteContext';
import { useMedico }   from '@/context/MedicoContext';
import { useCarrito }  from '@/context/CarritoContext';

export default function Navbar() {
  const { paciente, logout }       = usePaciente();
  const { medico,   logoutMedico } = useMedico();
  const { items }                  = useCarrito();
  const router                     = useRouter();
  const pathname                   = usePathname();

  if (pathname === '/login') return null;

  const handleLogout = () => {
    if (paciente) logout();
    if (medico)   logoutMedico();
    router.push('/login');
  };

  const navLink = (href, label) => (
    <Link
      href={href}
      className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        pathname === href
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link href={medico ? '/medico/turnos' : '/buscar'} className="flex items-center gap-2 text-blue-600 font-bold text-lg">
            🏥 <span>Sweet Medical</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {(paciente || medico) && (
              <span className="hidden sm:block text-sm text-gray-600 truncate max-w-[200px]">
                Hola, <strong>{paciente?.nombre ?? medico?.nombre}</strong>
                <span className="ml-1 text-xs text-gray-400">
                  {medico ? '(Médico)' : '(Paciente)'}
                </span>
              </span>
            )}

            {/* Links paciente */}
            {paciente && navLink('/buscar',     '🔍 Buscar')}
            {paciente && navLink('/mis-turnos', '📋 Mis turnos')}

            {/* Links médico */}
            {medico && navLink('/medico/turnos',         '📋 Mis turnos')}
            {medico && navLink('/medico/disponibilidad', '🗓 Disponibilidad')}

            {/* Solicitudes / carrito (solo paciente) */}
            {paciente && (
              <Link
                href="/solicitudes"
                aria-label={`Mis solicitudes: ${items.length} turnos`}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <span>🗓️</span>
                <span className="hidden sm:inline">Mis solicitudes</span>
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {items.length}
                  </span>
                )}
              </Link>
            )}

            {(paciente || medico) && (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Salir
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
