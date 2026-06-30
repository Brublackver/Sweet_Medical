'use client';
import { useState, useEffect } from 'react';
import { useRouter }            from 'next/navigation';
import Link                     from 'next/link';
import CampoPassword            from '@/components/ui/CampoPassword';
import { usePaciente }           from '@/context/PacienteContext';
import { registrarPaciente, getAllObrasSociales, guardarToken } from '@/lib/api';
import styles from '@/features/login/Login.module.css';

/*
    REGISTRO — Auto-registro público de PACIENTES.

    Solo los pacientes pueden registrarse solos. Los médicos los crea el admin
    (un médico auto-registrado sería un agujero de seguridad: aparecería en las
    búsquedas de turnos sin control).

    Flujo: crear paciente → login automático → /buscar.
    El backend hashea la contraseña y valida la unicidad del DNI; acá solo
    validamos en cliente para dar feedback inmediato antes de pegarle a la API.
*/

const FORM_VACIO = {
  usuario: '', password: '', confirmar: '',
  dni: '', nombre: '', obraSocial: '', planNombre: '',
};

export default function RegistroPage() {
  const { paciente, login: loginPaciente } = usePaciente();
  const router                             = useRouter();
  const [form, setForm]                    = useState(FORM_VACIO);
  const [obrasSociales, setObrasSociales]  = useState([]);
  const [cargando, setCargando]            = useState(false);
  const [error, setError]                  = useState('');

  // Si ya hay sesión de paciente, no tiene sentido mostrar el registro.
  useEffect(() => {
    if (paciente) router.replace('/buscar');
  }, [paciente, router]);

  // Catálogo público de obras sociales: el paciente elige obra social + plan,
  // y la cobertura sale del catálogo (no se inventa).
  useEffect(() => {
    getAllObrasSociales().then(setObrasSociales).catch(() => {});
  }, []);

  const obraSocialSel = obrasSociales.find((o) => o.nombre === form.obraSocial) || null;
  const planSel       = obraSocialSel?.planes.find((p) => p.nombre === form.planNombre) || null;

  const set = (campo) => (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [campo]: value }));
    setError('');
  };

  // Al cambiar de obra social, reseteo el plan (el anterior ya no aplica).
  const setObraSocial = (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, obraSocial: value, planNombre: '' }));
    setError('');
  };

  // Validación en cliente — refleja crearPacienteSchema del backend.
  const validar = () => {
    if (form.usuario.trim().length < 3) return 'El usuario debe tener al menos 3 caracteres.';
    if (form.password.length < 4)       return 'La contraseña debe tener al menos 4 caracteres.';
    if (form.password !== form.confirmar) return 'Las contraseñas no coinciden.';
    if (!/^\d{7,8}$/.test(form.dni.trim())) return 'El DNI debe tener 7 u 8 dígitos.';
    if (form.nombre.trim().length < 2)  return 'Ingresá tu nombre completo.';
    if (!obraSocialSel)                 return 'Elegí tu obra social.';
    if (!planSel)                       return 'Elegí tu plan.';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errorValidacion = validar();
    if (errorValidacion) { setError(errorValidacion); return; }

    setError('');
    setCargando(true);

    const payload = {
      usuario:    form.usuario.trim(),
      password:   form.password,
      dni:        form.dni.trim(),
      nombre:     form.nombre.trim(),
      obraSocial: obraSocialSel.nombre,
      plan: {
        nombre:           planSel.nombre,
        coberturaGeneral: planSel.coberturaGeneral,
      },
    };

    // Una sola request: crea la cuenta y devuelve la sesión ya iniciada.
    registrarPaciente(payload)
      .then((sesion) => {
        guardarToken(sesion.token);
        loginPaciente(sesion.usuario);
        router.push('/buscar');
      })
      .catch((err) => {
        setCargando(false);
        const status = err.response?.status;
        if (status === 409) {
          setError('Ya existe una cuenta con ese DNI o usuario.');
        } else if (status === 400) {
          setError(err.response?.data?.message || 'Revisá los datos ingresados.');
        } else {
          setError('Ocurrió un error al conectar con el servidor. Intentá de nuevo.');
        }
      });
  };

  return (
    <div className={styles.page}>

      <div className={styles.leftPanel}>
        <div className={styles.leftBg} />
        <div className={styles.leftTop}>
          <div className={styles.leftLogo}>🏥</div>
          <h1 className={styles.leftTitle}>Sweet Medical</h1>
          <p className={styles.leftSubtitle}>Creá tu cuenta y empezá a reservar turnos</p>
        </div>

        <div className={styles.features}>
          {[
            { icon: '📅', titulo: 'Turnos online',  desc: 'Reservá desde cualquier lugar, en cualquier momento.' },
            { icon: '🩺', titulo: 'Tu salud, simple', desc: 'Gestioná tus turnos y tu historial en un solo lugar.' },
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
            <p className={styles.mobileSubtitle}>Creá tu cuenta de paciente</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Crear cuenta</h2>
              <p className={styles.cardSubtitle}>Registrate como paciente para reservar turnos</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              <div>
                <label htmlFor="usuario" className={styles.label}>Usuario</label>
                <input id="usuario" type="text" value={form.usuario} onChange={set('usuario')}
                  placeholder="Ej: jperez" autoFocus autoComplete="username" className={styles.input} />
              </div>

              <div>
                <label htmlFor="nombre" className={styles.label}>Nombre completo</label>
                <input id="nombre" type="text" value={form.nombre} onChange={set('nombre')}
                  placeholder="Ej: Juan Pérez" autoComplete="name" className={styles.input} />
              </div>

              <div>
                <label htmlFor="dni" className={styles.label}>DNI</label>
                <input id="dni" type="text" inputMode="numeric" value={form.dni} onChange={set('dni')}
                  placeholder="Ej: 38456789" className={styles.input} />
              </div>

              <div>
                <label htmlFor="obraSocial" className={styles.label}>Obra social</label>
                <select id="obraSocial" value={form.obraSocial} onChange={setObraSocial} className={styles.input}>
                  <option value="">— Elegí tu obra social —</option>
                  {obrasSociales.map((o) => (
                    <option key={o.obra_social_id} value={o.nombre}>{o.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="planNombre" className={styles.label}>Plan</label>
                <select id="planNombre" value={form.planNombre} onChange={set('planNombre')}
                  disabled={!obraSocialSel} className={styles.input}>
                  <option value="">
                    {obraSocialSel ? '— Elegí tu plan —' : '— Primero elegí tu obra social —'}
                  </option>
                  {obraSocialSel?.planes.map((p) => (
                    <option key={p.nombre} value={p.nombre}>
                      {p.nombre} ({p.coberturaGeneral}% de cobertura)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="password" className={styles.label}>Contraseña</label>
                <CampoPassword id="password" value={form.password} onChange={set('password')}
                  placeholder="••••••" autoComplete="new-password" className={styles.input} />
              </div>

              <div>
                <label htmlFor="confirmar" className={styles.label}>Repetir contraseña</label>
                <CampoPassword id="confirmar" value={form.confirmar} onChange={set('confirmar')}
                  placeholder="••••••" autoComplete="new-password" className={styles.input} />
              </div>

              {error && (
                <div role="alert" className={styles.error}>
                  <span aria-hidden="true">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={cargando} className={styles.submitBtn}>
                {cargando ? 'Creando cuenta...' : 'Crear cuenta →'}
              </button>
            </form>
          </div>

          <p className={styles.hint}>
            ¿Ya tenés cuenta? <Link href="/login" className={styles.authLink}>Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
