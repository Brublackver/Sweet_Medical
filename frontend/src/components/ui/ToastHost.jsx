'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ToastHost.module.css';

// Cuánto vive el toast antes de irse solo. Coincide con la salida animada del CSS.
const DURACION_MS = 3500;

const nuevoId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

/**
 * Escucha el evento 'turno-solicitado' y muestra un toast tipo Facebook abajo a
 * la izquierda. Solo visible en desktop (el CSS lo oculta en mobile). Al tocarlo
 * navega al destino de la solicitud (Mis solicitudes).
 */
export default function ToastHost() {
  const router = useRouter();
  const [toasts, setToasts] = useState([]);

  const remover = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const onSolicitud = (e) => {
      const id = nuevoId();
      setToasts((prev) => [...prev, {
        id,
        mensaje: e.detail?.mensaje ?? 'Nueva solicitud',
        href:    e.detail?.href    ?? '/solicitudes',
      }]);
      setTimeout(() => remover(id), DURACION_MS);
    };
    window.addEventListener('turno-solicitado', onSolicitud);
    return () => window.removeEventListener('turno-solicitado', onSolicitud);
  }, [remover]);

  const handleClick = (toast) => {
    remover(toast.id);
    router.push(toast.href);
  };

  if (toasts.length === 0) return null;

  return (
    <div className={styles.contenedor} aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          className={styles.toast}
          onClick={() => handleClick(t)}
        >
          <span className={styles.icono} aria-hidden="true">🗓️</span>
          <span className={styles.texto}>
            <span className={styles.titulo}>{t.mensaje}</span>
            <span className={styles.sub}>Tocá para ver tus solicitudes</span>
          </span>
        </button>
      ))}
    </div>
  );
}
