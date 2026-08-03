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
  const [menuOpen, setMenuOpen]              = useState(false);

  useEffect(() => setMounted(true), []);

  // El menú mobile se cierra solo al cambiar de página.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Cerrar con la tecla Escape para accesibilidad.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

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
      onClick={closeMenu}
      className={`${styles.navLink} ${pathname === href ? styles.navLinkActive : ''}`}
    >
      {label}
    </Link>
  );

  // Link con globo numérico (notificaciones sin leer) arriba a la derecha.
  const navLinkNotif = (href, label, count) => (
    <Link
      href={href}
      onClick={closeMenu}
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
        {/* Botón hamburguesa — solo visible en mobile. Abre el menú desplegable. */}
        {mounted && (paciente || medico) && (
          <button
            type="button"
            className={styles.hamburger}
            aria-label={
              menuOpen
                ? 'Cerrar menú'
                : (cantidad > 0 || items.length > 0)
                  ? 'Abrir menú (tenés avisos sin ver)'
                  : 'Abrir menú'
            }
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={`${styles.hamburgerBox} ${menuOpen ? styles.hamburgerBoxOpen : ''}`}>
              <span className={styles.hamburgerBar} />
              <span className={styles.hamburgerBar} />
              <span className={styles.hamburgerBar} />
            </span>
            {/* Con menú cerrado: número si hay notificaciones del backend;
                si no, punto rojo cuando hay solicitudes pendientes en el carrito. */}
            {!menuOpen && cantidad > 0 && (
              <span className={styles.hamburgerBadge} aria-hidden="true">
                {cantidad > 9 ? '9+' : cantidad}
              </span>
            )}
            {!menuOpen && cantidad === 0 && items.length > 0 && (
              <span className={styles.hamburgerDot} aria-hidden="true" />
            )}
          </button>
        )}

        <Link href={medico ? '/medico/turnos' : '/buscar'} className={styles.logo} onClick={closeMenu}>
          🏥 <span>Sweet Medical</span>
        </Link>

        <div id="menu-mobile" className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
          {mounted && (paciente || medico) && (
            <span className={styles.userName}>
              Hola, <strong>{paciente?.nombre ?? medico?.nombre}</strong>
              {/* Las cuentas de prueba se marcan: el invitado tiene que saber
                  que lo que reserve se va a borrar solo. */}
              {paciente?.es_demo
                ? <span className={styles.demoTag} title="Cuenta temporal de prueba">cuenta de prueba</span>
                : <span> {medico ? '(Médico)' : '(Paciente)'}</span>}
            </span>
          )}

          {mounted && paciente && navLink('/buscar',         '🔍 Buscar')}
          {mounted && paciente && navLink('/mis-turnos',     '📋 Mis turnos')}
          {mounted && paciente && navLink('/avisos',         '⏳ Avisos')}
          {mounted && paciente && navLinkNotif('/notificaciones', '🔔 Notificaciones', cantidad)}

          {mounted && medico && navLink('/medico/turnos',         '📋 Mis turnos')}
          {mounted && medico && navLink('/medico/disponibilidad', '🗓 Disponibilidad')}
          {mounted && medico && navLinkNotif('/medico/notificaciones', '🔔 Notificaciones', cantidad)}

          {mounted && paciente && (
            <Link
              href="/solicitudes"
              onClick={closeMenu}
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

      {/* Fondo oscuro tras el menú mobile — cierra al tocar afuera. */}
      {menuOpen && (
        <div className={styles.backdrop} onClick={closeMenu} aria-hidden="true" />
      )}
    </nav>
  );
}
