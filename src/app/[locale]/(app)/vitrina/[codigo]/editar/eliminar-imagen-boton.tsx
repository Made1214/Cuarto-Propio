"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { BotonConfirmar } from "@/components/boton-confirmar";

export function EliminarImagenBoton({ action }: { action: () => void | Promise<void> }) {
  const t = useTranslations("vitrina");
  const [pendiente, startTransition] = useTransition();

  return (
    <BotonConfirmar
      titulo={t("eliminar")}
      mensaje={t("eliminarConfirmar")}
      textoConfirmar={t("eliminar")}
      etiqueta={t("eliminar")}
      onConfirmar={() => startTransition(() => void action())}
      className={`border-2 border-ink bg-primary-pink px-4 py-2 font-pixel text-xs tracking-wide text-ink-strong transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 ${
        pendiente ? "opacity-60" : ""
      }`}
    >
      {t("eliminar").toUpperCase()}
    </BotonConfirmar>
  );
}
