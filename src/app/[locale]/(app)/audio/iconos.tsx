/** Iconos del módulo de Audio. Mismo criterio que en la Vitrina: los adornos
 * de la sección se dibujan como píxeles cuadrados (el chiste retro) y las
 * acciones usan el trazo de 3px redondeado del resto de la app, para que un
 * botón se siga reconociendo por su forma. */

/** Casete: el ícono de la sección. */
export function IconoAudio() {
  return (
    <svg width="20" height="20" viewBox="0 0 12 10" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="12" height="2" />
      <rect x="0" y="2" width="2" height="6" />
      <rect x="10" y="2" width="2" height="6" />
      <rect x="0" y="8" width="12" height="2" />
      <rect x="3" y="4" width="2" height="2" />
      <rect x="7" y="4" width="2" height="2" />
      <rect x="5" y="4" width="2" height="1" />
    </svg>
  );
}

export function IconoReintentar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />
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

export function IconoEliminar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  );
}
