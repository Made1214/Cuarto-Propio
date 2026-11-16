"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { BotonConfirmar } from "@/components/boton-confirmar";

export function EliminarEntradaBoton({ action }: { action: () => void | Promise<void> }) {
  const t = useTranslations("diario");
  const [pendiente, startTransition] = useTransition();

  return (
    <BotonConfirmar
      titulo={t("eliminar")}
      mensaje={t("eliminarConfirmar")}
      textoConfirmar={t("eliminar")}
      etiqueta={t("eliminar")}
      onConfirmar={() => startTransition(() => void action())}
      className={`boton ${
        pendiente ? "opacity-60" : ""
      }`}
    >
      {t("eliminar")}
    </BotonConfirmar>
  );
}
