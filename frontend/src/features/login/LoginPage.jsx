'use client';
import { useState, useEffect } from 'react';
import { useRouter }            from 'next/navigation';
import { usePaciente }           from '@/context/PacienteContext';
import { useMedico }             from '@/context/MedicoContext';
import { useAdmin }              from '@/context/AdminContext';
import { getPaciente, getMedico } from '@/lib/api';
import styles from './Login.module.css';

const ADMIN_PASSWORD = '123456';

export default function LoginPage() {
  const { paciente, login: loginPaciente } = usePaciente();
  const { medico,   login: loginMedico }   = useMedico();
  const { admin,    login: loginAdmin }    = useAdmin();
  const router                             = useRouter();
  const [rol, setRol]                      = useState('paciente');
  const [id, setId]                        = useState('');
  const [cargando, setCargando]            = useState(false);
  const [error, setError]                  = useState('');

  useEffect(() => {
    if (paciente) { router.replace('/buscar');        return; }
    if (medico)   { router.replace('/medico/turnos'); return; }
    if (admin)    { router.replace('/admin'); }
  }, [paciente, medico, admin, router]);

  const handleRolChange = (r) => {
    setRol(r);
    setId('');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (rol === 'admin') {
      if (id !== ADMIN_PASSWORD) {
        setError('Contraseña incorrecta.');
        return;
      }
      loginAdmin();
      router.push('/admin');
      return;
    }

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
    <div className={styles.page}>

      <div className={styles.leftPanel}>
        <div className={styles.leftBg} />
        <div className={styles.leftTop}>
          <div className={styles.leftLogo}>🏥</div>
          <h1 className={styles.leftTitle}>Sweet Medical</h1>
          <p className={styles.leftSubtitle}>Sistema de gestión de turnos médicos</p>
        </div>

        <div className={styles.features}>
          {[
            { icon: '📅', titulo: 'Turnos online',  desc: 'Solicitá turnos desde cualquier lugar, en cualquier momento.' },
            { icon: '👨‍⚕️', titulo: 'Gestión médica', desc: 'Los médicos administran su agenda de forma sencilla.' },
            { icon: '🔔', titulo: 'Seguimiento',    desc: 'Confirmaciones y cambios de fecha en tiempo real.' },
          ].map(({ icon, titulo, desc }) => (
            <div key={titulo} className={styles.feature}>
              <span className={styles.featureIcon}>{icon}</span>
              <div>
                <p className={styles.featureTitle}>{titulo}</p>
                <p className={styles.featureDesc}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className={styles.leftFooter}>© 2026 Sweet Medical</p>
      </div>

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
                {rol === 'admin' ? 'Ingresá tu contraseña de administrador' : 'Seleccioná tu rol e ingresá tu ID'}
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
              <div>
                <label htmlFor="userId" className={styles.label}>
                  {rol === 'paciente' ? 'ID de Paciente' : rol === 'medico' ? 'ID de Médico' : 'Contraseña'}
                </label>
                <input
                  id="userId"
                  type={rol === 'admin' ? 'password' : 'number'}
                  min={rol === 'admin' ? undefined : '1'}
                  inputMode={rol === 'admin' ? undefined : 'numeric'}
                  value={id}
                  onChange={(e) => { setId(e.target.value); setError(''); }}
                  placeholder={rol === 'admin' ? '••••••' : 'Ej: 1'}
                  autoFocus
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
                disabled={cargando || !id.trim()}
                className={styles.submitBtn}
              >
                {cargando ? 'Verificando...' : 'Ingresar →'}
              </button>
            </form>
          </div>

          <p className={styles.hint}>
            {rol === 'admin'
              ? 'Acceso restringido para administradores del sistema.'
              : 'Tu ID te lo brinda la administración del centro médico.'}
          </p>
        </div>
      </div>
    </div>
  );
}
