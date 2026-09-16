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
        className="text-sm text-red-600 transition-colors hover:underline dark:text-red-400"
      >
        {t("eliminar")}
      </button>
    </form>
  );
}
