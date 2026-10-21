"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import type { Categoria } from "@/lib/categorias/types";

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
 * `onElegir` y sus propios textos traducidos; el refresco de la página lo
 * hace el componente.
 */
export function CategoriaSelector({
  categoriaId,
  categoriaNombre,
  categorias,
  onElegir,
  textos,
}: {
  categoriaId: string | null;
  categoriaNombre: string | null;
  categorias: Categoria[];
  onElegir: (nombre: string) => Promise<void>;
  textos: { cambiar: string; placeholder: string; quitar: string; nueva: string };
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nueva, setNueva] = useState("");
  const [pendiente, startTransition] = useTransition();

  function elegir(nombre: string) {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio === (categoriaNombre ?? "")) {
      setAbierto(false);
      return;
    }
    startTransition(async () => {
      await onElegir(nombreLimpio);
      setNueva("");
      setAbierto(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-label={textos.cambiar}
        disabled={pendiente}
        className="flex w-full items-center justify-between gap-2 border-2 px-2 py-1 text-left font-pixel text-xs tracking-wide"
        style={
          categoriaId
            ? {
                borderColor: "var(--ink-strong)",
                background: colorCategoria(categorias, categoriaId),
                color: "var(--ink-strong)",
              }
            : { borderColor: "var(--ink)", borderStyle: "dashed", opacity: 0.7 }
        }
      >
        <span className="truncate">{(categoriaNombre ?? textos.placeholder).toUpperCase()}</span>
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
        <div className="flex flex-col gap-2 border-2 border-ink bg-background p-2">
          <div className="flex flex-wrap gap-1.5">
            {categoriaId ? (
              <button
                type="button"
                onClick={() => elegir("")}
                disabled={pendiente}
                className="border-2 border-dashed border-ink px-2 py-0.5 font-pixel text-xs tracking-wide text-ink hover:bg-secondary-purple/10"
              >
                {textos.quitar.toUpperCase()}
              </button>
            ) : null}
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => elegir(cat.nombre)}
                disabled={pendiente}
                aria-pressed={cat.id === categoriaId}
                className={`border-2 px-2 py-0.5 font-pixel text-xs tracking-wide text-ink-strong ${
                  cat.id === categoriaId ? "border-ink-strong" : "border-transparent hover:border-ink-strong"
                }`}
                style={{ background: colorCategoria(categorias, cat.id) }}
              >
                {cat.id === categoriaId ? "✓ " : ""}
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
            disabled={pendiente}
            placeholder={textos.nueva}
            className="border-2 border-ink bg-card px-2 py-1 text-sm outline-none"
          />
        </div>
      ) : null}
    </div>
  );
}
