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
      className={`ventana-dialogo m-auto border-0 bg-transparent p-0 text-foreground backdrop:bg-velo ${
        ancho === "ancho"
          ? "w-[min(44rem,calc(100vw-2rem))]"
          : "w-[min(26rem,calc(100vw-2rem))]"
      }`}
    >
      <div className="flex flex-col border-(length:--borde) border-ink rounded-theme bg-card shadow-marco-lg">
        <div className="flex items-center justify-between gap-3 border-b-(length:--borde) border-ink bg-secondary-purple px-3 py-2">
          <h2 className="truncate font-pixel text-xs tracking-wide text-background uppercase">
            {titulo}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 border-(length:--borde) border-ink rounded-theme bg-primary-green" />
            <span aria-hidden="true" className="h-3 w-3 border-(length:--borde) border-ink rounded-theme bg-secondary-turquoise" />
            <button
              type="button"
              onClick={onCerrar}
              aria-label={etiquetaCerrar}
              title={etiquetaCerrar}
              className="flex h-3 w-3 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-primary-pink transition-[filter] hover:brightness-90"
            >
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="var(--ink-strong)" strokeWidth="5" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-5">{children}</div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t-(length:--borde) border-ink/15 px-5 pt-4 pb-5">
          {acciones}
        </div>
      </div>
    </dialog>
  );
}
