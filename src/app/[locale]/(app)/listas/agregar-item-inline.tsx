"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { agregarItem } from "@/lib/listas/actions";

export function AgregarItemInline({ listaId }: { listaId: string }) {
  const t = useTranslations("listas");
  const router = useRouter();
  const [valor, setValor] = useState("");
  const [pendiente, startTransition] = useTransition();
  const campoRef = useRef<HTMLInputElement>(null);

  // El campo NO se deshabilita mientras guarda: un input deshabilitado
  // pierde el foco, y llenar una lista es escribir ítem, Enter, ítem,
  // Enter — con el foco perdido en cada Enter eso es imposible.
  function enviar() {
    const contenido = valor.trim();
    if (!contenido) return;
    setValor("");
    startTransition(async () => {
      await agregarItem(listaId, contenido);
      router.refresh();
      campoRef.current?.focus();
    });
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
        disabled={pendiente}
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
