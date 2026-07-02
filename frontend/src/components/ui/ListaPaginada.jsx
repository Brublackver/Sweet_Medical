'use client';
import { Children, useState, useEffect } from 'react';
import Icono from './Icono';
import styles from './ListaPaginada.module.css';

/*
  ListaPaginada — reemplaza el carrusel horizontal por una LISTA VERTICAL
  paginada. En escritorio los carruseles molestan (obligan a deslizar de
  costado para ver algo que entra perfecto en una columna). Acá mostramos
  una página de items a la vez con controles de paginación accesibles.

  Admite dos formas de uso:
    1) Datos:   <ListaPaginada items={...} renderItem={(it) => <Card/>} getKey={...} />
    2) Children: <ListaPaginada>{lista.map(...)}</ListaPaginada>   (drop-in del Carousel)

  Props:
    items       → array de datos (opción 1).
    renderItem  → (item) => JSX (opción 1).
    getKey      → (item) => key estable (opción 1). Default: índice.
    children    → nodos ya renderizados (opción 2).
    porPagina   → cantidad de items por página (default 5).
    ariaLabel   → etiqueta accesible de la lista.
*/
export default function ListaPaginada({
  items,
  renderItem,
  getKey,
  children,
  porPagina = 5,
  ariaLabel = 'Lista de resultados',
  variante = 'lista',
}) {
  const [pagina, setPagina] = useState(1);

  // Normalizamos ambas formas de uso a una lista de { key, node }.
  const nodos = items
    ? items.map((item, i) => ({
        key:  getKey ? getKey(item) : i,
        node: renderItem(item),
      }))
    : Children.toArray(children).map((child, i) => ({
        key:  child.key ?? i,
        node: child,
      }));

  const total = nodos.length;

  // Al cambiar la CANTIDAD de items (ej. cambio de filtro) volvemos a la
  // primera página. Usamos la cantidad y no la referencia del array porque
  // el array suele recalcularse en cada render (nos dejaría trabados en pág. 1).
  useEffect(() => { setPagina(1); }, [total]);

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginaActual  = Math.min(pagina, totalPaginas);
  const desde         = (paginaActual - 1) * porPagina;
  const visibles      = nodos.slice(desde, desde + porPagina);

  return (
    <div className={styles.contenedor}>
      <ul className={variante === 'grilla' ? styles.listaGrid : styles.lista} role="list" aria-label={ariaLabel}>
        {visibles.map(({ key, node }) => (
          <li key={key} className={styles.item}>
            {node}
          </li>
        ))}
      </ul>

      {totalPaginas > 1 && (
        <nav className={styles.paginacion} aria-label="Paginación de resultados">
          <button
            type="button"
            className={styles.boton}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            aria-label="Página anterior"
          >
            <Icono nombre="flechaIzq" tamano={16} />
          </button>

          <span className={styles.indicador} aria-live="polite">
            Página {paginaActual} de {totalPaginas}
          </span>

          <button
            type="button"
            className={styles.boton}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            aria-label="Página siguiente"
          >
            <Icono nombre="flechaDer" tamano={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
