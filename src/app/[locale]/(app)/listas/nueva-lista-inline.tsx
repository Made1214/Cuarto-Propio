"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { crearLista } from "@/lib/listas/actions";
import { IconoEliminar } from "./iconos";

/** Vive en el encabezado, no en el tablero: crear una lista es una acción de
 * la página, y como tarjeta ocupaba un lugar de la cuadrícula. La variante
 * "panel" es la misma acción dentro del estado vacío, donde el botón tiene
 * que ser el siguiente paso obvio. */
export function NuevaListaInline({ variante = "boton" }: { variante?: "boton" | "panel" }) {
  const t = useTranslations("listas");
  const router = useRouter();
  const [activo, setActivo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [conCasillas, setConCasillas] = useState(false);
  const [pendiente, startTransition] = useTransition();

  function cerrar() {
    setNombre("");
    setConCasillas(false);
    setActivo(false);
  }

  if (!activo) {
    return (
      <button
        type="button"
        onClick={() => setActivo(true)}
        className={`flex items-center gap-2 border-2 border-ink bg-primary-green font-pixel tracking-wide text-ink-strong transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 ${
          variante === "panel"
            ? "px-5 py-3 text-xs shadow-[4px_4px_0_var(--ink)]"
            : "px-4 py-2.5 text-xs"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {t("nuevaLista").toUpperCase()}
      </button>
    );
  }

  function enviar() {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      cerrar();
      return;
    }
    startTransition(async () => {
      await crearLista(nombreLimpio, "", conCasillas);
      cerrar();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-2 border-ink bg-card p-2 shadow-[4px_4px_0_var(--ink)]">
      <input
        type="text"
        autoFocus
        value={nombre}
        onChange={(evento) => setNombre(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            evento.preventDefault();
            enviar();
          }
          if (evento.key === "Escape") cerrar();
        }}
        disabled={pendiente}
        placeholder={t("nombrePlaceholder")}
        className="min-w-0 flex-1 basis-48 border-2 border-ink bg-background px-2.5 py-1.5 text-sm outline-none"
      />

      <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm">
        <input
          type="checkbox"
          checked={conCasillas}
          onChange={(evento) => setConCasillas(evento.target.checked)}
          disabled={pendiente}
          className="h-4 w-4 shrink-0 cursor-pointer border-2 border-ink accent-secondary-purple"
        />
        {t("listaConCasillas")}
      </label>

      <button
        type="button"
        onClick={enviar}
        disabled={pendiente}
        className="border-2 border-ink bg-primary-green px-3 py-1.5 font-pixel text-xs tracking-wide text-ink-strong transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5"
      >
        {t("guardar").toUpperCase()}
      </button>
      <button
        type="button"
        onClick={cerrar}
        aria-label={t("cancelar")}
        title={t("cancelar")}
        className="flex h-8 w-8 items-center justify-center text-muted/70 transition-colors hover:bg-primary-pink/30 hover:text-ink"
      >
        <IconoEliminar />
      </button>
    </div>
  );
}
