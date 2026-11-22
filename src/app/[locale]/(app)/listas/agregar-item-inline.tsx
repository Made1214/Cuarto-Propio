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

  // Un campo y, pegado, el botón "+" siempre verde: antes el botón se veía
  // apagado mientras el campo estaba vacío y parecía roto. Vacío, tocarlo
  // lleva al campo; Enter también agrega.
  return (
    <div className="flex h-11 items-stretch overflow-hidden border-(length:--borde) border-ink rounded-theme bg-background transition-colors focus-within:border-secondary-purple">
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
        enterKeyHint="done"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted/60"
      />
      <button
        type="button"
        onClick={() => (valor.trim() ? enviar() : campoRef.current?.focus())}
        aria-label={t("agregarItem")}
        title={t("agregarItem")}
        className="flex w-11 shrink-0 items-center justify-center border-l-(length:--borde) border-ink bg-primary-green text-ink-strong transition-[filter] hover:brightness-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
