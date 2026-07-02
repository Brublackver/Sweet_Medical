import { useMemo, useRef, useState } from 'react';
import styles from '@/features/busqueda/Busqueda.module.css';

// Normaliza para comparar sin acentos ni mayúsculas: "Cardiología" ≈ "cardiologia".
const normalizar = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const MAX_SUGERENCIAS = 8;

/**
 * Input de texto con autocompletado. Las `opciones` son la lista completa
 * (ej: especialidades del sistema); el usuario escribe y se filtran en vivo.
 * `onChange` recibe el string ya elegido/escrito (no un evento).
 */
export default function CampoAutocompletado({
  id,
  label,
  placeholder,
  value,
  onChange,
  opciones = [],
}) {
  const [abierto, setAbierto]     = useState(false);
  const [indiceActivo, setIndice] = useState(-1);
  const cierreTimeout             = useRef(null);

  const sugerencias = useMemo(() => {
    const q = normalizar(value.trim());
    const base = q === ''
      ? opciones
      : opciones.filter((o) => normalizar(o).includes(q));
    return base.slice(0, MAX_SUGERENCIAS);
  }, [value, opciones]);

  // Si lo tipeado ya coincide exacto con la única sugerencia, no hace falta mostrarla.
  const yaElegido =
    sugerencias.length === 1 && normalizar(sugerencias[0]) === normalizar(value.trim());

  const mostrar = abierto && sugerencias.length > 0 && !yaElegido;

  const elegir = (opcion) => {
    onChange(opcion);
    setAbierto(false);
    setIndice(-1);
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    setAbierto(true);
    setIndice(-1);
  };

  const handleKeyDown = (e) => {
    if (!mostrar) {
      if (e.key === 'ArrowDown') { setAbierto(true); setIndice(0); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndice((i) => Math.min(i + 1, sugerencias.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndice((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && indiceActivo >= 0) {
      // Evita que el Enter dispare el submit del formulario al elegir sugerencia.
      e.preventDefault();
      elegir(sugerencias[indiceActivo]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
      setIndice(-1);
    }
  };

  // El blur cierra con un pequeño delay para que el click en una opción alcance a dispararse.
  const handleBlur = () => {
    cierreTimeout.current = setTimeout(() => setAbierto(false), 120);
  };
  const handleFocus = () => {
    if (cierreTimeout.current) clearTimeout(cierreTimeout.current);
    setAbierto(true);
  };

  const listboxId = `${id}-listbox`;

  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.campoLabel}>{label}</label>
      <div className={styles.autocompleteWrap}>
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={styles.campoInput}
          role="combobox"
          aria-expanded={mostrar}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={indiceActivo >= 0 ? `${id}-opt-${indiceActivo}` : undefined}
          autoComplete="off"
        />

        {mostrar && (
          <ul id={listboxId} role="listbox" className={styles.sugerencias}>
            {sugerencias.map((opcion, i) => (
              <li
                key={opcion}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === indiceActivo}
                className={`${styles.sugerenciaItem} ${i === indiceActivo ? styles.sugerenciaActiva : ''}`}
                // onMouseDown en vez de onClick: corre antes del blur del input.
                onMouseDown={(e) => { e.preventDefault(); elegir(opcion); }}
                onMouseEnter={() => setIndice(i)}
              >
                {opcion}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
