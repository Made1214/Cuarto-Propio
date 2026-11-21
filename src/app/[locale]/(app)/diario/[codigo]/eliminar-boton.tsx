"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { BotonConfirmar } from "@/components/boton-confirmar";

/**
 * Eliminar es la acción secundaria de la barra de una entrada: en el celular
 * es solo el tacho (con su nombre para el lector de pantalla), para que la
 * principal —Guardar o Editar— tenga el lugar; desde tablet lleva texto.
 */
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
      className={`boton w-11 px-0 sm:w-auto sm:px-4 ${pendiente ? "opacity-60" : ""}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
      </svg>
      <span className="sr-only sm:not-sr-only">{t("eliminar")}</span>
    </BotonConfirmar>
  );
}
