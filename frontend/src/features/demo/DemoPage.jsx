'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link          from 'next/link';
import { usePaciente } from '@/context/PacienteContext';
import { crearSesionDemo, guardarToken } from '@/lib/api';
import styles from './Demo.module.css';

/*
  DemoPage — "probá la app sin registrarte".

  Crea un paciente temporal con obra social y plan ya asignados y entra con él.
  No pide ningún dato: el objetivo es que alguien que llega por primera vez
  pueda ver el sistema funcionando en dos clics.

  Se le muestra al invitado QUÉ cuenta le tocó antes de entrar (nombre, obra
  social, plan y vencimiento). Que sea temporal tiene que quedar explícito: si
  reserva turnos y después se le borra todo, mejor que lo sepa de antemano.
*/

const CAPACIDADES = [
  { icon: '🔍', texto: 'Buscar turnos por especialidad, práctica, sede o médico' },
  { icon: '🗓️', texto: 'Reservar y cancelar turnos reales' },
  { icon: '⏳', texto: 'Anotarte en la fila de espera cuando no haya disponibilidad' },
  { icon: '🔔', texto: 'Recibir notificaciones de cambios y avisos' },
];

export default function DemoPage() {
  const { paciente, cargado, login } = usePaciente();
  const router                       = useRouter();
  const [cuenta, setCuenta]          = useState(null);
  const [cargando, setCargando]      = useState(false);
  const [error, setError]            = useState('');

  // Si ya hay sesión, no tiene sentido crear otra cuenta.
  useEffect(() => {
    if (cargado && paciente) router.replace('/buscar');
  }, [cargado, paciente, router]);

  const handleCrear = () => {
    setError('');
    setCargando(true);

    crearSesionDemo()
      .then((sesion) => {
        guardarToken(sesion.token);
        setCuenta(sesion.usuario);
      })
      .catch(() => setError('No pudimos crear la cuenta de prueba. Intentá de nuevo en un momento.'))
      .finally(() => setCargando(false));
  };

  // La sesión se activa recién acá: hasta que el invitado no confirma, el
  // contexto queda intacto y puede volverse sin quedar logueado a medias.
  const handleEntrar = () => {
    login(cuenta);
    router.push('/buscar');
  };

  const duracion = (minutos) => {
    if (minutos == null) return null;
    if (minutos < 60) return `${minutos} minutos`;
    const horas = Math.floor(minutos / 60);
    return horas === 1 ? '1 hora' : `${horas} horas`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        <header className={styles.header}>
          <p className={styles.icon} aria-hidden="true">🎫</p>
          <h1 className={styles.title}>Probá Sweet Medical</h1>
          <p className={styles.subtitle}>
            Creamos una cuenta de invitado para que recorras el sistema.
            Sin registro, sin datos personales.
          </p>
        </header>

        {!cuenta && (
          <>
            <ul className={styles.lista}>
              {CAPACIDADES.map((c) => (
                <li key={c.texto} className={styles.item}>
                  <span className={styles.itemIcon} aria-hidden="true">{c.icon}</span>
                  <span>{c.texto}</span>
                </li>
              ))}
            </ul>

            {error && <p role="alert" className={styles.error}>⚠️ {error}</p>}

            <button
              type="button"
              onClick={handleCrear}
              disabled={cargando}
              className={styles.btnPrincipal}
            >
              {cargando ? 'Creando cuenta...' : 'Crear cuenta de prueba →'}
            </button>

            <p className={styles.nota}>
              La cuenta es <strong>temporal</strong>: se borra sola junto con los turnos
              que hayas reservado. Es solo para probar.
            </p>
          </>
        )}

        {cuenta && (
          <div role="status">
            <div className={styles.exito}>
              <span aria-hidden="true">✅</span>
              <span>Tu cuenta de prueba está lista</span>
            </div>

            <dl className={styles.ficha}>
              <div className={styles.fichaFila}>
                <dt className={styles.fichaLabel}>Nombre</dt>
                <dd className={styles.fichaValor}>{cuenta.nombre}</dd>
              </div>
              <div className={styles.fichaFila}>
                <dt className={styles.fichaLabel}>Obra social</dt>
                <dd className={styles.fichaValor}>{cuenta.obraSocial ?? 'Sin cobertura'}</dd>
              </div>
              {cuenta.plan && (
                <div className={styles.fichaFila}>
                  <dt className={styles.fichaLabel}>Plan</dt>
                  <dd className={styles.fichaValor}>
                    {cuenta.plan.nombre} · {cuenta.plan.coberturaGeneral}% de cobertura
                  </dd>
                </div>
              )}
              {cuenta.minutos_restantes != null && (
                <div className={styles.fichaFila}>
                  <dt className={styles.fichaLabel}>Vence en</dt>
                  <dd className={styles.fichaValor}>{duracion(cuenta.minutos_restantes)}</dd>
                </div>
              )}
            </dl>

            <button type="button" onClick={handleEntrar} className={styles.btnPrincipal}>
              Entrar y buscar turnos →
            </button>
          </div>
        )}

        <p className={styles.pie}>
          ¿Preferís una cuenta propia?{' '}
          <Link href="/registro" className={styles.link}>Registrate</Link>
          {' · '}
          <Link href="/login" className={styles.link}>Ya tengo cuenta</Link>
        </p>
      </div>
    </div>
  );
}
