'use client';
import { Children, useEffect, useRef, useState } from 'react';
import styles from './Carousel.module.css';

/*
  Carousel reutilizable y accesible.

  - Deslizamiento horizontal con scroll-snap (sin librerías externas).
  - Cada hijo se envuelve en un "slide" de ancho fijo, así la lista NO
    crece verticalmente: ocupa una fila y se navega de costado.
  - Flechas que se deshabilitan en los extremos (feedback visual claro).
  - Accesible: lista semántica (ul/li), navegación por teclado (el track
    es focusable y se mueve con las flechas del navegador), aria-labels,
    y respeta prefers-reduced-motion (en el CSS).

  Props:
    children  → los items a mostrar (uno por slide).
    ariaLabel → etiqueta accesible de la lista deslizable.
*/
export default function Carousel({ children, ariaLabel = 'Lista deslizable' }) {
  const trackRef = useRef(null);
  const [puedeIzquierda, setPuedeIzquierda] = useState(false);
  const [puedeDerecha, setPuedeDerecha] = useState(false);

  const items = Children.toArray(children);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const actualizarControles = () => {
      // Tolerancia de 4px para evitar parpadeos por redondeo subpíxel.
      setPuedeIzquierda(track.scrollLeft > 4);
      setPuedeDerecha(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
    };

    actualizarControles();
    track.addEventListener('scroll', actualizarControles, { passive: true });
    window.addEventListener('resize', actualizarControles);
    return () => {
      track.removeEventListener('scroll', actualizarControles);
      window.removeEventListener('resize', actualizarControles);
    };
  }, [items.length]);

  const desplazar = (direccion) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direccion * track.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div className={styles.carousel}>
      <button
        type="button"
        onClick={() => desplazar(-1)}
        disabled={!puedeIzquierda}
        aria-label="Ver elementos anteriores"
        className={styles.flecha}
      >
        ‹
      </button>

      <ul ref={trackRef} className={styles.track} role="list" aria-label={ariaLabel} tabIndex={0}>
        {items.map((child, i) => (
          <li key={child.key ?? i} className={styles.slide}>
            {child}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => desplazar(1)}
        disabled={!puedeDerecha}
        aria-label="Ver más elementos"
        className={styles.flecha}
      >
        ›
      </button>
    </div>
  );
}
