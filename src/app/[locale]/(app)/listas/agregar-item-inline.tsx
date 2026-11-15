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

  // Un solo renglón punteado con el "+" adentro: se lee como "acá va el
  // siguiente ítem", y Enter lo agrega sin buscar un botón.
  return (
    <div className="flex h-10 items-center gap-2 border-2 border-dashed border-ink/40 pl-2.5 transition-colors focus-within:border-solid focus-within:border-ink">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
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
        aria-label={t("agregarItem")}
        placeholder={t("itemPlaceholder")}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
      />
      {valor.trim() ? (
        <button
          type="button"
          onClick={enviar}
          className="h-full shrink-0 border-l-2 border-ink bg-primary-green px-3 text-[13px] font-semibold text-ink-strong transition-[filter] hover:brightness-95"
        >
          {t("agregar")}
        </button>
      ) : null}
    </div>
  );
}
