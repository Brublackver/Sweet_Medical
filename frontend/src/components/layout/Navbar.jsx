'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePaciente } from '@/context/PacienteContext';
import { useMedico }   from '@/context/MedicoContext';
import { useAdmin }    from '@/context/AdminContext';
import { useCarrito }  from '@/context/CarritoContext';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { paciente, logout: logoutPaciente } = usePaciente();
  const { medico,   logout: logoutMedico }   = useMedico();
  const { admin,    logout: logoutAdmin }    = useAdmin();
  const { items }                            = useCarrito();
  const router                               = useRouter();
  const pathname                             = usePathname();
  const [mounted, setMounted]                = useState(false);

  useEffect(() => setMounted(true), []);

  // Contador de notificaciones sin leer para el badge del link.
  // Misma fuente de verdad que la página: el hook useNotificaciones.
  const usuarioTipo = medico ? 'MEDICO' : paciente ? 'PACIENTE' : null;
  const usuarioId   = medico?.medico_id ?? paciente?.paciente_id ?? null;
  const { cantidad } = useNotificaciones(usuarioTipo, usuarioId);

  if (pathname === '/login') return null;
  if (pathname === '/admin') return null;

  const handleLogout = () => {
    if (paciente) logoutPaciente();
    if (medico)   logoutMedico();
    if (admin)    logoutAdmin();
    router.push('/login');
  };

  const navLink = (href, label) => (
    <Link
      href={href}
      className={`${styles.navLink} ${pathname === href ? styles.navLinkActive : ''}`}
    >
      {label}
    </Link>
  );

  // Link con globo numérico (notificaciones sin leer) arriba a la derecha.
  const navLinkNotif = (href, label, count) => (
    <Link
      href={href}
      className={`${styles.navLinkNotif} ${pathname === href ? styles.navLinkActive : ''}`}
      aria-label={count > 0 ? `${label}: ${count} sin leer` : label}
    >
      {label}
      {count > 0 && (
        <span className={styles.notifBadge} aria-hidden="true">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );

  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      <div className={styles.inner}>
        <Link href={medico ? '/medico/turnos' : '/buscar'} className={styles.logo}>
          🏥 <span>Sweet Medical</span>
        </Link>

        <div className={styles.links}>
          {mounted && (paciente || medico) && (
            <span className={styles.userName}>
              Hola, <strong>{paciente?.nombre ?? medico?.nombre}</strong>
              <span> {medico ? '(Médico)' : '(Paciente)'}</span>
            </span>
          )}

          {mounted && paciente && navLink('/buscar',         '🔍 Buscar')}
          {mounted && paciente && navLink('/mis-turnos',     '📋 Mis turnos')}
          {mounted && paciente && navLinkNotif('/notificaciones', '🔔 Notificaciones', cantidad)}

          {mounted && medico && navLink('/medico/turnos',         '📋 Mis turnos')}
          {mounted && medico && navLink('/medico/disponibilidad', '🗓 Disponibilidad')}
          {mounted && medico && navLinkNotif('/medico/notificaciones', '🔔 Notificaciones', cantidad)}

          {mounted && paciente && (
            <Link
              href="/solicitudes"
              aria-label={`Mis solicitudes: ${items.length} turnos`}
              className={styles.carritoBtn}
            >
              <span>🗓️</span>
              <span className={styles.carritoLabel}>Mis solicitudes</span>
              {items.length > 0 && (
                <span className={styles.carritoBadge}>{items.length}</span>
              )}
            </Link>
          )}

          {mounted && (paciente || medico) && (
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Salir
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
