"use client";

import {
  CLASE_CHIP,
  CLASE_CHIP_ACTIVO,
  CLASE_CHIP_INACTIVO,
} from "@/components/filtro-categoria";
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

  // Una categoría nueva todavía no está en la lista: se suma (ordenada por
  // nombre, como la devuelve `listarCategorias`) para que se vea al
  // momento. Sin fecha de creación cuenta como la más nueva, así que su
  // color ya es el que va a tener cuando llegue la real.
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
        // La categoría se lee como en el resto de la app: un punto de color y
        // el nombre, no una franja pintada que le compite al título.
        className={`flex min-h-8 w-fit max-w-full items-center gap-1.5 border-(length:--borde) rounded-theme px-2 text-left text-[0.8125rem] font-medium transition-colors hover:border-ink ${
          actual.id ? "border-ink/30 text-ink" : "border-dashed border-ink/40 text-muted/70"
        }`}
      >
        {actual.id ? (
          <span
            aria-hidden="true"
            className="punto-categoria"
            style={{ background: colorCategoria(categoriasVisibles, actual.id) }}
          />
        ) : null}
        <span className="truncate">{actual.nombre ?? textos.placeholder}</span>
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
                className={`${CLASE_CHIP} ${CLASE_CHIP_INACTIVO} border-dashed`}
              >
                {textos.quitar}
              </button>
            ) : null}
            {categoriasVisibles.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => elegir(cat.nombre)}
                aria-pressed={cat.id === actual.id}
                className={`${CLASE_CHIP} ${cat.id === actual.id ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO}`}
              >
                <span
                  aria-hidden="true"
                  className="punto-categoria"
                  style={{ background: colorCategoria(categoriasVisibles, cat.id) }}
                />
                <span className="max-w-40 truncate">{cat.nombre}</span>
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
