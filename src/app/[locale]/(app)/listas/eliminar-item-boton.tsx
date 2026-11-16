"use client";

import { useTranslations } from "next-intl";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { IconoEliminar } from "./iconos";

/** La confirmación se queda acá; el borrado en sí lo hace la columna, que es
 * la que saca la fila de la vista en el momento (y la devuelve si falla). */
export function EliminarItemBoton({ onEliminar }: { onEliminar: () => void }) {
  const t = useTranslations("listas");

  return (
    <BotonConfirmar
      titulo={t("eliminarItem")}
      mensaje={t("eliminarItemConfirmar")}
      textoConfirmar={t("eliminar")}
      etiqueta={t("eliminarItem")}
      onConfirmar={onEliminar}
      className="flex h-7 w-7 shrink-0 items-center pointer-coarse:h-11 pointer-coarse:w-11 justify-center text-ink/35 transition-colors hover:bg-primary-pink/30 hover:text-ink focus-visible:bg-primary-pink/30 focus-visible:text-ink"
    >
      <IconoEliminar />
    </BotonConfirmar>
  );
}
