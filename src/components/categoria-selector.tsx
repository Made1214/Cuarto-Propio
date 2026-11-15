"use client";

import { useOptimistic, useState, useTransition } from "react";
import { colorCategoria } from "@/lib/categorias/color";
import type { Categoria } from "@/lib/categorias/types";

/** Id provisorio de una categoría recién escrita que el servidor todavía no
 * creó: no choca con ningún uuid real. */
const ID_PROVISORIO = "provisoria";

/**
 * Elegir (o crear al vuelo) la categoría de algo, desde la tarjeta misma.
 *
 * Se despliega dentro de la tarjeta (no como popover flotante) para que la
 * tarjeta simplemente crezca — un popover absoluto se corta en el layout de
 * columnas de Listas y de Audio. Siempre lista TODAS las categorías: a
 * diferencia de un <datalist>, no filtra por lo que ya está elegido.
 *
 * Es compartido entre módulos a propósito: las categorías son el eje
 * transversal de la app (CLAUDE.md), así que asignarlas se ve y se siente
 * igual en Listas y en Audio. Cada módulo pone su Server Action en
 * `onElegir` (que refresca la página desde el servidor) y sus propios textos
 * traducidos; si la action falla, el componente vuelve a la categoría real y
 * avisa por `onError`, para que el error se muestre donde la tarjeta muestra
 * los suyos.
 */
export function CategoriaSelector({
  categoriaId,
  categoriaNombre,
  categorias,
  onElegir,
  onError,
  textos,
}: {
  categoriaId: string | null;
  categoriaNombre: string | null;
  categorias: Categoria[];
  onElegir: (nombre: string) => Promise<void>;
  /** Recibe el error tal cual: la tarjeta decide qué aviso mostrar. */
  onError?: (fallo: unknown) => void;
  textos: { cambiar: string; placeholder: string; quitar: string; nueva: string };
}) {
  const [abierto, setAbierto] = useState(false);
  const [nueva, setNueva] = useState("");
  const [, startTransition] = useTransition();

  // La categoría elegida se muestra en el momento; la real (props) vuelve a
  // mandar cuando termina la action, con la página ya refrescada o, si
  // falló, tal como estaba.
  const [actual, setActual] = useOptimistic<{ id: string | null; nombre: string | null }>({
    id: categoriaId,
    nombre: categoriaNombre,
  });

  // Una categoría nueva todavía no está en la lista: se suma ordenada por
  // nombre (como la devuelve `listarCategorias`) para que su color ya sea
  // el que va a tener cuando llegue la real, en vez de cambiar al refrescar.
  const categoriasVisibles =
    actual.id === ID_PROVISORIO && actual.nombre
      ? [...categorias, { id: ID_PROVISORIO, nombre: actual.nombre }].sort((a, b) =>
          a.nombre.localeCompare(b.nombre),
        )
      : categorias;

  function elegir(nombre: string) {
    const nombreLimpio = nombre.trim();
    // Se cierra fuera de la transición: dentro, el cierre esperaría a que
    // responda el servidor, y la gracia es que el panel se vaya ya.
    setNueva("");
    setAbierto(false);
    // Se compara con lo que se VE (el optimista), no con las props: elegir
    // dos veces lo mismo mientras viaja la primera no manda nada.
    if (nombreLimpio === (actual.nombre ?? "")) return;

    const existente = categorias.find((cat) => cat.nombre === nombreLimpio);
    startTransition(async () => {
      setActual(
        nombreLimpio
          ? { id: existente?.id ?? ID_PROVISORIO, nombre: nombreLimpio }
          : { id: null, nombre: null },
      );
      try {
        await onElegir(nombreLimpio);
      } catch (fallo) {
        // Al terminar la transición sin página nueva, `actual` vuelve solo a
        // la categoría real; acá solo queda avisar.
        startTransition(() => onError?.(fallo));
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-label={textos.cambiar}
        className="flex w-full items-center justify-between gap-2 border-(length:--borde) px-2 py-1 text-left font-pixel text-xs tracking-wide"
        style={
          actual.id
            ? {
                borderColor: "var(--ink-strong)",
                background: colorCategoria(categoriasVisibles, actual.id),
                color: "var(--ink-strong)",
              }
            : { borderColor: "var(--ink)", borderStyle: "dashed", opacity: 0.7 }
        }
      >
        <span className="truncate">{(actual.nombre ?? textos.placeholder).toUpperCase()}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {abierto ? (
        <div className="flex flex-col gap-2 border-(length:--borde) border-ink rounded-theme bg-background p-2">
          <div className="flex flex-wrap gap-1.5">
            {actual.id ? (
              <button
                type="button"
                onClick={() => elegir("")}
                className="border-(length:--borde) border-dashed border-ink rounded-theme px-2 py-0.5 font-pixel text-xs tracking-wide text-ink hover:bg-secondary-purple/10"
              >
                {textos.quitar.toUpperCase()}
              </button>
            ) : null}
            {categoriasVisibles.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => elegir(cat.nombre)}
                aria-pressed={cat.id === actual.id}
                className={`border-(length:--borde) px-2 py-0.5 font-pixel text-xs tracking-wide text-ink-strong ${
                  cat.id === actual.id ? "border-ink-strong" : "border-transparent hover:border-ink-strong"
                }`}
                style={{ background: colorCategoria(categoriasVisibles, cat.id) }}
              >
                {cat.id === actual.id ? "✓ " : ""}
                {cat.nombre.toUpperCase()}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={nueva}
            onChange={(evento) => setNueva(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter") {
                evento.preventDefault();
                if (nueva.trim()) elegir(nueva);
              }
              if (evento.key === "Escape") setAbierto(false);
            }}
            placeholder={textos.nueva}
            className="border-(length:--borde) border-ink rounded-theme bg-card px-2 py-1 text-sm outline-none"
          />
        </div>
      ) : null}
    </div>
  );
}
