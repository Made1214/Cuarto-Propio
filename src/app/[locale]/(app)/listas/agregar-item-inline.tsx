"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

/** Solo el campo: el ítem lo agrega la columna, que lo muestra pendiente en
 * el momento mientras viaja al servidor. */
export function AgregarItemInline({ onAgregar }: { onAgregar: (contenido: string) => void }) {
  const t = useTranslations("listas");
  const [valor, setValor] = useState("");
  const campoRef = useRef<HTMLInputElement>(null);

  // El campo NO se deshabilita mientras guarda: un input deshabilitado
  // pierde el foco, y llenar una lista es escribir ítem, Enter, ítem,
  // Enter — con el foco perdido en cada Enter eso es imposible. El campo se
  // vacía antes de enviar, así que un segundo Enter no duplica el ítem.
  function enviar() {
    const contenido = valor.trim();
    if (!contenido) return;
    setValor("");
    onAgregar(contenido);
    campoRef.current?.focus();
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={campoRef}
        type="text"
        value={valor}
        onChange={(evento) => setValor(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            evento.preventDefault();
            enviar();
          }
        }}
        placeholder={t("itemPlaceholder")}
        className="min-w-0 flex-1 border-2 border-ink/30 bg-transparent px-2 py-1.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-ink"
      />
      <button
        type="button"
        onClick={enviar}
        aria-label={t("agregarItem")}
        title={t("agregarItem")}
        className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-ink bg-primary-green text-ink-strong transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5"
      >
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
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
