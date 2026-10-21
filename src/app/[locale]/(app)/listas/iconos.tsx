/** Iconos SVG compartidos del modulo de listas: mismo lenguaje visual
 * (trazo 3px, esquinas redondeadas) en vez de mezclar glifos Unicode ("✕")
 * con SVGs — así toda acción se reconoce por su forma, no por adivinar. */

export function IconoCasilla({ activa }: { activa: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      {activa ? <path d="M7.5 12.5l3 3 6-6.5" /> : null}
    </svg>
  );
}

/** Agarre de arrastre: seis puntos en cuadrícula, el patrón universal para
 * "esto se mueve", dibujado como píxeles para no romper el estilo. */
export function IconoAgarre() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="3" height="3" />
      <rect x="7" y="0" width="3" height="3" />
      <rect x="0" y="5.5" width="3" height="3" />
      <rect x="7" y="5.5" width="3" height="3" />
      <rect x="0" y="11" width="3" height="3" />
      <rect x="7" y="11" width="3" height="3" />
    </svg>
  );
}

export function IconoFlecha({ hacia }: { hacia: "arriba" | "abajo" }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={hacia === "abajo" ? "rotate-180" : ""}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function IconoEliminar() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
