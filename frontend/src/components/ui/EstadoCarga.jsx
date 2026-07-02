'use client';
import Icono from './Icono';
import styles from './EstadoCarga.module.css';

/*
  EstadoCarga — "loader con resultados".

  Centraliza la lógica repetida en cada pantalla que consume el backend:
  evaluar si está CARGANDO, si hubo ERROR o si el resultado está VACÍO, y
  recién si todo salió bien renderizar a sus hijos.

  Antes esta cadena de `if` estaba copiada en MisTurnos, Buscar, Médico, etc.
  Ahora vive en un solo lugar con identidad propia.

  Props:
    cargando      → muestra el slot de carga (skeleton/spinner).
    error         → muestra el mensaje de error (role="alert").
    vacio         → muestra el estado vacío (sin resultados).
    slotCargando  → nodo de carga a medida (ej. <SkeletonDia/>). Default: spinner.
    slotError     → nodo de error a medida. Default: mensaje con icono.
    slotVacio     → nodo de vacío a medida (ej. CTA "Buscar turnos").
    textoError    → mensaje de error por defecto.
    children      → contenido a mostrar cuando hay datos válidos.
*/
export default function EstadoCarga({
  cargando,
  error,
  vacio = false,
  slotCargando,
  slotError,
  slotVacio,
  textoError = 'No pudimos cargar la información. Probá de nuevo en un momento.',
  textoVacio = 'No hay resultados para mostrar.',
  children,
}) {
  if (cargando) {
    return (
      slotCargando ?? (
        <div className={styles.centro} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <span className={styles.cargandoTexto}>Cargando…</span>
        </div>
      )
    );
  }

  if (error) {
    return (
      slotError ?? (
        <div className={styles.error} role="alert">
          <Icono nombre="alerta" />
          <span>{textoError}</span>
        </div>
      )
    );
  }

  if (vacio) {
    return slotVacio ?? <p className={styles.vacio}>{textoVacio}</p>;
  }

  return <>{children}</>;
}
