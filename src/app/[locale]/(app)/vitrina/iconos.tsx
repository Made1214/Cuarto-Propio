/** Iconos de la Vitrina. Dos lenguajes conviven a propósito: los adornos de
 * ventana se dibujan como píxeles cuadrados (es el chiste retro de la
 * sección) y las acciones usan el mismo trazo de 3px redondeado que el resto
 * de la app, para que un botón se siga reconociendo por su forma. */

/** Marco/vitrina: el ícono de la sección. */
export function IconoVitrina() {
  return (
    <svg width="20" height="20" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="10" height="2" />
      <rect x="0" y="2" width="2" height="8" />
      <rect x="8" y="2" width="2" height="8" />
      <rect x="2" y="8" width="6" height="2" />
      <rect x="4" y="4" width="2" height="2" />
    </svg>
  );
}

/** Los tres botones de una ventana Y2K (minimizar, maximizar, cerrar). Son
 * decorativos: la tarjeta entera es el enlace, así que no hay tres destinos
 * distintos escondidos en esquinas de 10px. */
export function BotonesVentana() {
  return (
    <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
      <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
        <rect x="1" y="6" width="7" height="2" />
      </svg>
      <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
        <rect x="1" y="1" width="7" height="2" />
        <rect x="1" y="1" width="2" height="7" />
        <rect x="6" y="1" width="2" height="7" />
        <rect x="1" y="6" width="7" height="2" />
      </svg>
      <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
        <rect x="1" y="1" width="2" height="2" />
        <rect x="3" y="3" width="2" height="2" />
        <rect x="5" y="5" width="2" height="2" />
        <rect x="5" y="1" width="2" height="2" />
        <rect x="1" y="5" width="2" height="2" />
      </svg>
    </span>
  );
}

export function IconoSubir() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 17V4M6 10l6-6 6 6M4 20h16" />
    </svg>
  );
}

export function IconoCerrar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconoVolver() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function IconoReintentar() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />
    </svg>
  );
}

/** Lápiz: editar. La acción vive aparte de la ficha, así que necesita un
 * ícono propio y reconocible, no un texto más. */
export function IconoLapiz() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
    </svg>
  );
}
