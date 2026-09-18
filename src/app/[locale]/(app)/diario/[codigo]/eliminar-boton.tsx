"use client";

import { useTranslations } from "next-intl";

export function EliminarEntradaBoton({ action }: { action: () => void | Promise<void> }) {
  const t = useTranslations("diario");

  return (
    <form
      action={action}
      onSubmit={(evento) => {
        if (!window.confirm(t("eliminarConfirmar"))) {
          evento.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="border-2 border-ink bg-primary-pink px-4 py-2 font-pixel text-xs tracking-wide text-ink-strong transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5"
      >
        {t("eliminar").toUpperCase()}
      </button>
    </form>
  );
}
