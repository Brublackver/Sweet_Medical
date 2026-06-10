# Punto 3 — Justificación del cumplimiento de los Requerimientos No Funcionales

Cada requerimiento se justifica con **evidencia concreta y verificable** en el código.

## 1. Interfaz Intuitiva

> *El diseño debe ser claro; navegación coherente; acceso a las funcionalidades en pocos clics.*

- **Navegación coherente y persistente**: el componente `Navbar.jsx` está presente en
  toda la aplicación (montado en `ClientShell`) y muestra **enlaces contextuales según el
  rol** (paciente vs. médico). La sección activa se resalta comparando la ruta actual con
  `usePathname()` de Next.
- **Pocos clics**: el flujo principal del paciente es lineal y corto —
  *Login → Buscar → Preseleccionar → Confirmar* (3–4 pasos).
- **Selección guiada en lugar de adivinanza**: los filtros de búsqueda (sede, médico) y la
  gestión en el panel Admin usan **dropdowns poblados con datos reales del Backend**
  (`getAllSedes`, `getAllMedicos`, `getAllPacientes`). El usuario **elige de una lista**
  en vez de escribir un nombre exacto o adivinar un ID.
- **Redirecciones automáticas**: las páginas protegidas redirigen a `/login` si no hay
  sesión (`router.replace`), evitando estados ambiguos.

## 2. Aprendizaje Rápido

> *Seguir patrones de ecommerce conocidos; textos y elementos visuales que guíen al usuario.*

- **Patrones de ecommerce reconocibles**: módulo de preselección equivalente a un
  **carrito** ("Mis solicitudes"), botón de alternancia **"+ Solicitar" / "✓ Solicitado"**
  (`TarjetaTurno.jsx`), **badge con contador** de items en el Navbar, y una pantalla de
  **confirmación tipo checkout** con resumen y total estimado (`ConfirmacionPage.jsx`).
- **Textos descriptivos**: cada pantalla tiene título y subtítulo que explican la acción
  (ej. *"Encontrá turnos disponibles y agregálos a tu preselección"*), placeholders guía
  en los formularios y **estados vacíos** con icono + explicación + llamada a la acción
  (ej. "No hay turnos en tu lista → Buscar turnos").
- **Iconografía universal** para reforzar el significado (🔍 Buscar, 📋 Mis turnos,
  🗓️ Solicitudes).

## 3. Feedback Visual y Notificaciones

> *Mensajes de error y confirmación; indicadores de carga (loaders, skeletons).*

- **Mensajes de error y confirmación en cada interacción**: manejo explícito de
  `setError` / `setResultado` mostrados en cajas con `role="alert"` (búsqueda, login,
  altas y gestión en Admin, acciones de médico y paciente).
- **Skeletons durante la carga**: el componente `Skeleton.jsx` (`SkeletonDia`) se muestra
  mientras se resuelven las peticiones de búsqueda y de turnos, evitando la sensación de
  app "congelada".
- **Spinners en acciones**: los botones de **Buscar** y **Confirmar solicitud** muestran un
  spinner SVG y se deshabilitan mientras la petición está en curso (`cargando`).
- **Estados visuales del dominio**: `EstadoBadge` (reservado / realizado / cancelado /
  cambio pendiente) y `CoberturasBadge` (cobertura completa / parcial) comunican el estado
  de un vistazo.
- **Anuncio accesible de resultados**: la zona de resultados de búsqueda usa
  `aria-live="polite"` para notificar cambios a lectores de pantalla.

## 4. Diseño Responsivo

> *Funcional en desktop, tablets y móviles; elementos accesibles en cualquier tamaño.*

> **Evidencia cuantitativa:** 19 `@media queries` en 9 hojas de estilo (CSS Modules),
> con breakpoints en 640px (tablet), 1024px y 1280px (desktop).

- **Layouts adaptativos**: en `/buscar`, el panel de filtros pasa de apilarse arriba en
  mobile a un **sidebar fijo** junto a los resultados en desktop (`grid-template-columns`).
  Las tarjetas de turno del médico pasan de disposición vertical a horizontal en ≥640px.
- **Carrusel responsivo**: los carruseles de listados usan slides de `min(80vw, 22rem)`,
  de modo que en mobile se ve ~1 tarjeta (con swipe nativo) y en desktop varias.
- **Unidades fluidas y `box-sizing`**: inputs y contenedores con anchos relativos y
  `box-sizing: border-box` para que no desborden en pantallas chicas.

## 5. Accesibilidad

> *Contrastes adecuados, etiquetas ARIA, navegación por teclado, textos/botones legibles.*

> **Evidencia cuantitativa:** 38 atributos ARIA/`role` en 17 archivos.

- **Etiquetas ARIA**: `aria-label` descriptivos (ej. botones del carrusel "Ver elementos
  anteriores/siguientes", "Quitar … de mis solicitudes"), `role="alert"` en errores,
  `aria-live="polite"` en resultados, `aria-pressed` en el toggle de solicitar,
  `aria-selected` en las pestañas y `aria-describedby` en el formulario de login.
- **Navegación por teclado**: el carrusel expone su contenedor como región enfocable
  (`tabIndex=0`) navegable con teclado; todos los controles son botones/inputs nativos con
  estilos `:focus-visible`.
- **Respeto de `prefers-reduced-motion`**: el carrusel desactiva el desplazamiento suave
  para usuarios que reducen el movimiento (`Carousel.module.css`).
- **Linter de accesibilidad activo**: `eslint-plugin-jsx-a11y` (incluido en
  `eslint-config-next`) se ejecuta en `npm run lint`, **previniendo regresiones** de
  accesibilidad de forma automática.
- **Contraste y tamaño**: paleta de alto contraste (textos `#111827` / `#374151` sobre
  fondo blanco) y áreas táctiles amplias para uso en móvil.

## 6. Consistencia en la UI

> *Estilos, colores y tipografías homogéneos; componentes reutilizables coherentes.*

- **Componentes reutilizables**: `Carousel`, `EstadoBadge`, `Badge` y `Skeleton` se usan de
  forma uniforme en todas las vistas, garantizando el mismo aspecto y comportamiento.
- **Paleta y tokens visuales homogéneos**: mismos colores (azul de acción `#2563eb`,
  escala de grises), radios de borde (`0.5–0.75rem`) y tipografía a lo largo de toda la app.
- **Helpers centralizados**: `lib/fecha.js` (formato de fechas) y `lib/turnos.js` (filtros)
  garantizan que la misma lógica se vea **idéntica en todas las pantallas**.
- **Arquitectura por features + componentes compartidos**: separación clara entre
  `features/` (páginas) y `components/` (UI reutilizable), lo que evita duplicación y
  mantiene patrones de diseño coherentes.



