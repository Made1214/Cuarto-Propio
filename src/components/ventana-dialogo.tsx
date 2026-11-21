"use client";

import { useEffect, useRef } from "react";

/**
 * Diálogo con forma de ventanita de escritorio Y2K, el mismo motivo que la
 * barra superior de la app.
 *
 * Va sobre el `<dialog>` nativo a propósito: atrapar el foco, cerrar con
 * Escape, inertizar el fondo y pintar el velo son cosas que el navegador ya
 * hace bien — una librería retro traería su propia paleta fija y romperían
 * los temas, que tienen que poder repintar esto entero.
 */
export function VentanaDialogo({
  abierto,
  titulo,
  onCerrar,
  children,
  acciones,
  etiquetaCerrar,
  ancho = "normal",
}: {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
  acciones: React.ReactNode;
  etiquetaCerrar: string;
  /** "ancho" para lo que necesita más de una columna (por ejemplo una tanda
   * de fotos con sus datos); el resto de los diálogos son de una sola idea
   * y se leen mejor angostos. */
  ancho?: "normal" | "ancho";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const ventana = ref.current;
    if (!ventana) return;
    if (abierto && !ventana.open) ventana.showModal();
    if (!abierto && ventana.open) ventana.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      // Un clic en el velo (el área del propio <dialog>, fuera de la caja)
      // cierra, como cualquier ventana modal.
      onClick={(evento) => {
        if (evento.target === ref.current) onCerrar();
      }}
      // Nunca más alta que la pantalla (con el teclado abierto incluido:
      // `dvh`): el contenido se desplaza adentro y los botones de abajo
      // quedan siempre a la vista.
      className={`ventana-dialogo m-auto max-h-[calc(100dvh-2rem)] border-0 bg-transparent p-0 text-foreground backdrop:bg-velo ${
        ancho === "ancho"
          ? "w-[min(44rem,calc(100vw-2rem))]"
          : "w-[min(26rem,calc(100vw-2rem))]"
      }`}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col border-(length:--borde) border-ink rounded-theme bg-card shadow-marco-lg">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b-(length:--borde) border-ink bg-secondary-purple py-1 pr-1 pl-3">
          <h2 className="truncate font-pixel text-xs tracking-wide text-background uppercase">
            {titulo}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 border-(length:--borde) border-ink rounded-theme bg-primary-green" />
            <span aria-hidden="true" className="h-3 w-3 border-(length:--borde) border-ink rounded-theme bg-secondary-turquoise" />
            {/* La ✕ de verdad: el cuadradito rosa de 12 px de antes era
                imposible de acertar con el dedo. El área de toque es de
                36 px (44 en pantallas táctiles); el dibujo sigue chico. */}
            <button
              type="button"
              onClick={onCerrar}
              aria-label={etiquetaCerrar}
              title={etiquetaCerrar}
              className="group flex h-9 w-9 items-center justify-center pointer-coarse:h-11 pointer-coarse:w-11"
            >
              <span className="flex h-5 w-5 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-primary-pink transition-[filter] group-hover:brightness-90">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ink-strong)" strokeWidth="4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">{children}</div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t-(length:--borde) border-ink/15 px-4 pt-3 pb-4 sm:px-5 sm:pt-4 sm:pb-5">
          {acciones}
        </div>
      </div>
    </dialog>
  );
}
