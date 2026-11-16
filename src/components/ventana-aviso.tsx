/**
 * Ventanita para los avisos que ocupan una pantalla entera (un error, una
 * entrada que ya no existe): el mismo motivo de ventana Y2K que la barra de
 * la app y los diálogos, pero fija en la página en vez de modal — no hay
 * nada detrás a lo que volver, el aviso ES la pantalla.
 *
 * Solo presentación, sin estado ni hooks: la usan tanto `error.tsx` (que
 * por convención es de cliente) como los `not-found.tsx`, y cada uno le
 * pasa sus textos ya traducidos y sus propios botones.
 */
export function VentanaAviso({
  barra,
  titulo,
  mensaje,
  children,
  rol,
}: {
  /** Texto chico de la barra de título, como el nombre de una ventana. */
  barra: string;
  titulo: string;
  mensaje: string;
  /** Las acciones (reintentar, volver…), centradas debajo del mensaje. */
  children: React.ReactNode;
  /** "alert" cuando el aviso aparece de golpe en lugar de lo que se pidió
   * (un error), para que el lector de pantalla lo anuncie sin esperar. */
  rol?: "alert";
}) {
  return (
    <div
      role={rol}
      className="mx-auto my-auto flex w-full max-w-md flex-col border-(length:--borde) border-ink rounded-theme bg-card shadow-marco-lg"
    >
      <div className="flex items-center justify-between gap-3 border-b-(length:--borde) border-ink bg-secondary-purple px-3 py-2">
        <p className="truncate font-pixel text-xs tracking-wide text-background uppercase">
          {barra}
        </p>
        <div className="flex shrink-0 items-center gap-2" aria-hidden="true">
          <span className="h-3 w-3 border-(length:--borde) border-ink rounded-theme bg-primary-green" />
          <span className="h-3 w-3 border-(length:--borde) border-ink rounded-theme bg-secondary-turquoise" />
          <span className="h-3 w-3 border-(length:--borde) border-ink rounded-theme bg-primary-pink" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
        {/* El mismo corazón de píxeles de la barra de la app: el aviso
            sigue siendo parte del cuarto, no una pantalla ajena. */}
        <svg width="28" height="24" viewBox="0 0 14 12" aria-hidden="true">
          <rect x="2" y="0" width="4" height="2" fill="var(--primary-pink)" />
          <rect x="8" y="0" width="4" height="2" fill="var(--primary-pink)" />
          <rect x="0" y="2" width="14" height="2" fill="var(--primary-pink)" />
          <rect x="0" y="4" width="14" height="2" fill="var(--primary-pink)" />
          <rect x="2" y="6" width="10" height="2" fill="var(--primary-pink)" />
          <rect x="4" y="8" width="6" height="2" fill="var(--primary-pink)" />
          <rect x="6" y="10" width="2" height="2" fill="var(--primary-pink)" />
        </svg>
        <h1 className="font-diario text-2xl font-bold text-secondary-purple">{titulo}</h1>
        <p className="text-sm leading-relaxed text-muted/70">{mensaje}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">{children}</div>
      </div>
    </div>
  );
}

/** Clases del botón principal de un aviso (verde, con la sombra sólida que
 * se "hunde" al tocarlo), compartidas para que reintentar y volver se vean
 * como parte de la misma familia de botones de la app. */
export const BOTON_AVISO_PRINCIPAL =
  "boton boton-verde";

/** Clases del botón secundario: plano, sin sombra, para no competir con la
 * acción principal. */
export const BOTON_AVISO_SECUNDARIO =
  "boton";
