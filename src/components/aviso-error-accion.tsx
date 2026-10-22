"use client";

import { useTranslations } from "next-intl";
import type { ErrorAccion } from "@/lib/acciones/errores";

const CLASE_AVISO = "border-2 border-ink bg-primary-pink px-3 py-2 text-xs text-ink-strong";

/**
 * El aviso rosado que las tarjetas muestran cuando no se pudo guardar algo.
 * Cada módulo pone su propio mensaje para el fallo común; el de "la app se
 * actualizó" es el mismo en todos (ver `clasificarErrorAccion`) y trae el
 * botón para recargar, que es lo único que lo arregla.
 */
export function AvisoErrorAccion({
  error,
  mensajeFallo,
}: {
  error: ErrorAccion | null;
  mensajeFallo: string;
}) {
  const t = useTranslations("estados");

  if (!error) return null;

  if (error === "desactualizada") {
    return (
      <div role="alert" className={`flex flex-wrap items-center justify-between gap-2 ${CLASE_AVISO}`}>
        <span>{t("appActualizada")}</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 border-2 border-ink bg-card px-2.5 py-1 font-pixel text-[10px] tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
        >
          {t("recargar").toUpperCase()}
        </button>
      </div>
    );
  }

  return (
    <p role="alert" className={CLASE_AVISO}>
      {mensajeFallo}
    </p>
  );
}
