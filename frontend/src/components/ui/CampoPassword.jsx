'use client';
import { useState } from 'react';
import Icono from './Icono';
import styles from './CampoPassword.module.css';

/*
  Input de contraseña con botón "ojo" para mostrar/ocultar lo que se tipea.

  Reenvía todas las props al <input> (value, onChange, placeholder, autoFocus,
  autoComplete, id, etc.). El `className` que recibe se aplica al input — así
  hereda el estilo del formulario donde se use — y le sumamos un padding a la
  derecha para que el texto no quede tapado por el ojo.

  El botón es tabIndex={-1} a propósito: es una ayuda visual, no debe robar el
  foco al tabular entre campos del formulario.
*/
export default function CampoPassword({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrapper}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${className} ${styles.conIcono}`.trim()}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={-1}
      >
        <Icono nombre={visible ? 'ojoTachado' : 'ojo'} tamano={18} />
      </button>
    </div>
  );
}
