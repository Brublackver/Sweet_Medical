'use client';
import { useState, useEffect } from 'react';
import { useRouter }            from 'next/navigation';
import Link                     from 'next/link';
import CampoPassword            from '@/components/ui/CampoPassword';
import AuthSidePanel             from '@/components/auth/AuthSidePanel';
import { usePaciente }           from '@/context/PacienteContext';
import { useMedico }             from '@/context/MedicoContext';
import { useAdmin }              from '@/context/AdminContext';
import { login as loginRequest, guardarToken } from '@/lib/api';
import styles from './Login.module.css';

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

  useEffect(() => {
    if (paciente) { router.replace('/buscar');        return; }
    if (medico)   { router.replace('/medico/turnos'); return; }
    if (admin)    { router.replace('/admin'); }
  }, [paciente, medico, admin, router]);

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
          : 'Ocurrió un error al conectar con el servidor. Intentá de nuevo.'
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
              {['paciente', 'medico', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRolChange(r)}
                  className={`${styles.roleBtn} ${rol === r ? styles.roleBtnActive : ''}`}
                >
                  {r === 'paciente' ? '👤 Paciente' : r === 'medico' ? '👨‍⚕️ Médico' : '🔐 Admin'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              {rol !== 'admin' && (
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

              {error && (
                <div id="login-error" role="alert" className={styles.error}>
                  <span aria-hidden="true">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={cargando || (rol !== 'admin' && !usuario.trim()) || !password.trim()}
                className={styles.submitBtn}
              >
                {cargando ? 'Verificando...' : 'Ingresar →'}
              </button>
            </form>
          </div>

          <p className={styles.hint}>
            {rol === 'admin'
              ? 'Acceso restringido para administradores del sistema.'
              : rol === 'medico'
                ? 'Tus credenciales te las brinda la administración del centro médico.'
                : <>¿No tenés cuenta? <Link href="/registro" className={styles.authLink}>Creá una</Link></>}
          </p>
        </div>
      </div>
    </div>
  );
}
