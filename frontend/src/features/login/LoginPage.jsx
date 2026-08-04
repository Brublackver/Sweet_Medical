'use client';
import { useState, useEffect } from 'react';
import { useRouter }            from 'next/navigation';
import Link                     from 'next/link';
import CampoPassword            from '@/components/ui/CampoPassword';
import AuthSidePanel             from '@/components/auth/AuthSidePanel';
import { usePaciente }           from '@/context/PacienteContext';
import { useMedico }             from '@/context/MedicoContext';
import { useAdmin }              from '@/context/AdminContext';
import { login as loginRequest, crearSesionDemo, guardarToken } from '@/lib/api';
import styles from './Login.module.css';

/*
  Roles visibles en el selector. El acceso de ADMIN no se muestra: el panel es
  para la administración del centro, no algo que un paciente deba ver al entrar.

  OJO — esto es presentación, NO seguridad. El endpoint POST /auth/login sigue
  aceptando rol "admin" y /admin sigue existiendo. Lo que protege el panel es
  requireAdmin en el backend (middleware/authMiddleware.js), no este arreglo
  visual. Para entrar como admin: /login?admin=1
*/
const ROLES_VISIBLES = [
  { id: 'paciente', label: '👤 Paciente' },
  { id: 'medico',   label: '👨‍⚕️ Médico' },
  { id: 'demo',     label: '🎫 Probar' },
];

const ROL_ADMIN = { id: 'admin', label: '🔐 Admin' };

export default function LoginPage() {
  const { paciente, login: loginPaciente } = usePaciente();
  const { medico,   login: loginMedico }   = useMedico();
  const { admin,    login: loginAdmin }    = useAdmin();
  const router                             = useRouter();
  const [rol, setRol]                      = useState('paciente');
  const [usuario, setUsuario]              = useState('');
  const [password, setPassword]            = useState('');
  const [cargando, setCargando]            = useState(false);
  const [error, setError]                  = useState('');
  const [mostrarAdmin, setMostrarAdmin]    = useState(false);

  useEffect(() => {
    if (paciente) { router.replace('/buscar');        return; }
    if (medico)   { router.replace('/medico/turnos'); return; }
    if (admin)    { router.replace('/admin'); }
  }, [paciente, medico, admin, router]);

  // El acceso de admin se revela solo con /login?admin=1 (o ?rol=admin).
  // Se lee de window y no con useSearchParams para no forzar el render dinámico
  // de la página ni tener que envolverla en un <Suspense>.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('admin') || params.get('rol') === 'admin') {
      setMostrarAdmin(true);
      setRol('admin');
    }
  }, []);

  const roles = mostrarAdmin ? [...ROLES_VISIBLES, ROL_ADMIN] : ROLES_VISIBLES;

  const handleRolChange = (r) => {
    setRol(r);
    setUsuario('');
    setPassword('');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    // Cuenta de prueba: no hay credenciales que validar. El backend crea un
    // invitado temporal y devuelve la sesión con el MISMO shape que el login,
    // así que desde acá se maneja igual que un paciente cualquiera.
    if (rol === 'demo') {
      crearSesionDemo()
        .then((sesion) => {
          guardarToken(sesion.token);
          loginPaciente(sesion.usuario);
          router.push('/buscar');
        })
        // Se distingue "el servidor respondió mal" de "no llegamos al servidor":
        // son problemas distintos y un mensaje único los tapa a los dos.
        .catch((err) => setError(
          err.response
            ? `No pudimos crear la cuenta de prueba (el servidor respondió ${err.response.status}). Intentá de nuevo.`
            : 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.'
        ))
        .finally(() => setCargando(false));
      return;
    }

    // El backend valida las credenciales y emite el token de sesión.
    loginRequest(rol, rol === 'admin' ? '' : usuario, password)
      .then((sesion) => {
        guardarToken(sesion.token);
        if (rol === 'admin') {
          loginAdmin();
          router.push('/admin');
        } else if (rol === 'paciente') {
          loginPaciente(sesion.usuario);
          router.push('/buscar');
        } else {
          loginMedico(sesion.usuario);
          router.push('/medico/turnos');
        }
      })
      .catch((err) => setError(
        err.response?.status === 401
          ? (rol === 'admin' ? 'Contraseña incorrecta.' : 'Usuario o contraseña incorrectos.')
          : err.response
            ? `Ocurrió un error en el servidor (${err.response.status}). Intentá de nuevo.`
            : 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.'
      ))
      .finally(() => setCargando(false));
  };

  return (
    <div className={styles.page}>

      <AuthSidePanel
        subtitle="Sistema de gestión de turnos médicos"
        features={[
          { icon: '📅', titulo: 'Turnos online',  desc: 'Solicitá turnos desde cualquier lugar, en cualquier momento.' },
          { icon: '👨‍⚕️', titulo: 'Gestión médica', desc: 'Los médicos administran su agenda de forma sencilla.' },
          { icon: '🔔', titulo: 'Seguimiento',    desc: 'Confirmaciones y cambios de fecha en tiempo real.' },
        ]}
      />

      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>

          <div className={styles.mobileHeader}>
            <div className={styles.mobileIcon} aria-hidden="true">🏥</div>
            <h1 className={styles.mobileTitle}>Sweet Medical</h1>
            <p className={styles.mobileSubtitle}>Sistema de gestión de turnos médicos</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Bienvenido</h2>
              <p className={styles.cardSubtitle}>
                {rol === 'admin' ? 'Ingresá tu contraseña de administrador' : 'Seleccioná tu rol e ingresá tus credenciales'}
              </p>
            </div>

            <div className={styles.roleToggle} role="group" aria-label="Tipo de usuario">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRolChange(r.id)}
                  aria-pressed={rol === r.id}
                  className={`${styles.roleBtn} ${rol === r.id ? styles.roleBtnActive : ''}`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              {/* La cuenta de prueba no pide credenciales: se explica qué es y
                  se entra de un clic. */}
              {rol === 'demo' && (
                <div className={styles.demoInfo}>
                  <p className={styles.demoTitulo}>🎫 Entrá sin registrarte</p>
                  <p className={styles.demoTexto}>
                    Te creamos una cuenta de invitado con obra social y plan asignados
                    para que pruebes el sistema. Es <strong>temporal</strong>: se borra
                    sola junto con los turnos que reserves.
                  </p>
                </div>
              )}

              {rol !== 'admin' && rol !== 'demo' && (
                <div>
                  <label htmlFor="usuario" className={styles.label}>Usuario</label>
                  <input
                    id="usuario"
                    type="text"
                    value={usuario}
                    onChange={(e) => { setUsuario(e.target.value); setError(''); }}
                    placeholder="Ej: jperez"
                    autoFocus
                    autoComplete="username"
                    aria-describedby={error ? 'login-error' : undefined}
                    className={styles.input}
                  />
                </div>
              )}

              {rol !== 'demo' && (
                <div>
                  <label htmlFor="password" className={styles.label}>Contraseña</label>
                  <CampoPassword
                    id="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••"
                    autoFocus={rol === 'admin'}
                    autoComplete="current-password"
                    aria-describedby={error ? 'login-error' : undefined}
                    className={styles.input}
                  />
                </div>
              )}

              {error && (
                <div id="login-error" role="alert" className={styles.error}>
                  <span aria-hidden="true">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  cargando || (rol !== 'demo' && (
                    (rol !== 'admin' && !usuario.trim()) || !password.trim()
                  ))
                }
                className={styles.submitBtn}
              >
                {rol === 'demo'
                  ? (cargando ? 'Creando cuenta...' : 'Crear cuenta de prueba →')
                  : (cargando ? 'Verificando...'    : 'Ingresar →')}
              </button>
            </form>
          </div>

          <p className={styles.hint}>
            {rol === 'admin'
              ? 'Acceso restringido para administradores del sistema.'
              : rol === 'medico'
                ? 'Tus credenciales te las brinda la administración del centro médico.'
                : rol === 'demo'
                  ? <>¿Preferís una cuenta propia? <Link href="/registro" className={styles.authLink}>Registrate</Link></>
                  : <>¿No tenés cuenta? <Link href="/registro" className={styles.authLink}>Creá una</Link></>}
          </p>
        </div>
      </div>
    </div>
  );
}
