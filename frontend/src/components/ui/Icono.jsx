/*
  Set de iconos SVG inline reutilizables.

  - Por defecto son decorativos (aria-hidden): el texto accesible lo aporta
    el botón/enlace contenedor vía aria-label.
  - Si un icono ES el único contenido semántico, pasar `titulo` para exponerlo
    a lectores de pantalla (role="img" + <title>).

  Uso:  <Icono nombre="papelera" />
        <Icono nombre="campana" titulo="Notificaciones" />
*/

const PATHS = {
  papelera: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  equis: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  campana: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  alerta: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  flechaIzq: <path d="m15 18-6-6 6-6" />,
  flechaDer: <path d="m9 18 6-6-6-6" />,
  ojo: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  ojoTachado: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </>
  ),
};

export default function Icono({ nombre, tamano = 18, titulo, className }) {
  const contenido = PATHS[nombre];
  if (!contenido) return null;

  const accesibilidad = titulo
    ? { role: 'img', 'aria-label': titulo }
    : { 'aria-hidden': 'true', focusable: 'false' };

  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...accesibilidad}
    >
      {contenido}
    </svg>
  );
}
