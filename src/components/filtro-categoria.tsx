"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import type { Categoria } from "@/lib/categorias/types";

/** Los cuatro cuadraditos de "todas las categorías". Fuera del componente:
 * no depende de nada y así no se vuelve a crear en cada render. */
const ICONO_TODAS = (
  <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
    <rect x="0" y="0" width="4" height="4" fill="var(--secondary-purple)" />
    <rect x="6" y="0" width="4" height="4" fill="var(--secondary-purple)" />
    <rect x="0" y="6" width="4" height="4" fill="var(--secondary-purple)" />
    <rect x="6" y="6" width="4" height="4" fill="var(--secondary-purple)" />
  </svg>
);

const CLASE_OPCION =
  "flex items-center gap-2 px-3 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10 aria-[current=page]:bg-secondary-purple/10";

/**
 * El desplegable "filtrar por categoría" de Diario, Listas y Audio.
 *
 * Desplegable en vez de chips: con muchas categorías, los chips se desbordan
 * y no caben bien en una fila — el desplegable siempre se ve prolijo, sin
 * importar cuántas categorías haya.
 *
 * Sigue siendo un `<details>` (teclado y lector de pantalla gratis, y se
 * abre aunque el JavaScript todavía no haya llegado), pero un `<details>`
 * solo se cierra tocando su propio disparador. Como elegir una opción navega
 * a la misma página con otro `?categoria=`, el componente no se desmonta y
 * el menú quedaba abierto encima de los resultados. Por eso se cierra a
 * mano al elegir, con Escape (devolviendo el foco al disparador, para no
 * dejar a quien navega con teclado perdida en la página) y al tocar afuera.
 */
export function FiltroCategoria({
  pathname,
  categorias,
  categoriaActualId,
  conservar,
  etiquetaTodas,
  ancho = "w-64",
  alinearDerecha = false,
  iconoTodas = false,
}: {
  pathname: string;
  categorias: Categoria[];
  /** La categoría vigente, ya validada contra `categorias` en el servidor. */
  categoriaActualId: string | null;
  /** Los otros filtros de la página (la búsqueda, el hashtag), que elegir
   * una categoría no tiene que borrar. Nunca `hasta`: cambiar de filtro
   * vuelve a la primera tanda. */
  conservar?: Record<string, string>;
  etiquetaTodas: string;
  ancho?: "w-64" | "w-72";
  /** Cuando el desplegable vive a la derecha de la pantalla, el menú se
   * abre hacia adentro en vez de salirse por el borde. */
  alinearDerecha?: boolean;
  iconoTodas?: boolean;
}) {
  const detallesRef = useRef<HTMLDetailsElement>(null);
  const disparadorRef = useRef<HTMLElement>(null);
  // Solo para saber cuándo escuchar al documento: mientras está cerrado no
  // hace falta ningún listener global.
  const [abierto, setAbierto] = useState(false);

  const categoriaActual = categorias.find((cat) => cat.id === categoriaActualId) ?? null;

  function cerrar() {
    if (detallesRef.current) detallesRef.current.open = false;
  }

  useEffect(() => {
    if (!abierto) return;
    const detalles = detallesRef.current;

    function alTocar(evento: PointerEvent) {
      if (detalles && !detalles.contains(evento.target as Node)) detalles.open = false;
    }
    function alTeclear(evento: KeyboardEvent) {
      if (evento.key !== "Escape" || !detalles) return;
      detalles.open = false;
      disparadorRef.current?.focus();
    }

    document.addEventListener("pointerdown", alTocar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("pointerdown", alTocar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  return (
    <details
      ref={detallesRef}
      onToggle={(evento) => setAbierto(evento.currentTarget.open)}
      className="group relative w-fit"
    >
      <summary
        ref={disparadorRef}
        className={`marker:content-none flex ${ancho} cursor-pointer list-none items-center justify-between gap-2 border-2 border-ink bg-card px-4 py-2.5 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10 [&::-webkit-details-marker]:hidden`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {categoriaActual ? (
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 border-2 border-ink-strong"
              style={{ background: colorCategoria(categorias, categoriaActual.id) }}
            />
          ) : iconoTodas ? (
            ICONO_TODAS
          ) : null}
          <span className="truncate">{(categoriaActual?.nombre ?? etiquetaTodas).toUpperCase()}</span>
        </span>
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
          className="shrink-0 transition-transform group-open:rotate-180"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div
        className={`absolute z-20 mt-2 flex ${ancho} flex-col border-2 border-ink bg-card p-1 shadow-[4px_4px_0_var(--ink)] ${
          alinearDerecha ? "right-0" : ""
        }`}
      >
        <Link
          href={{ pathname, query: conservar ?? {} }}
          onClick={cerrar}
          aria-current={categoriaActual ? undefined : "page"}
          className={CLASE_OPCION}
        >
          {iconoTodas ? ICONO_TODAS : null}
          {etiquetaTodas.toUpperCase()}
        </Link>
        {categorias.map((cat) => (
          <Link
            key={cat.id}
            href={{ pathname, query: { ...conservar, categoria: cat.id } }}
            onClick={cerrar}
            aria-current={cat.id === categoriaActual?.id ? "page" : undefined}
            className={CLASE_OPCION}
          >
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 border-2 border-ink-strong"
              style={{ background: colorCategoria(categorias, cat.id) }}
            />
            <span className="truncate">{cat.nombre.toUpperCase()}</span>
          </Link>
        ))}
      </div>
    </details>
  );
}
