"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { useRouter } from "@/i18n/navigation";
import { eliminarItem } from "@/lib/listas/actions";
import { IconoEliminar } from "./iconos";

export function EliminarItemBoton({ itemId }: { itemId: string }) {
  const t = useTranslations("listas");
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  return (
    <BotonConfirmar
      titulo={t("eliminarItem")}
      mensaje={t("eliminarItemConfirmar")}
      textoConfirmar={t("eliminar")}
      etiqueta={t("eliminarItem")}
      onConfirmar={() => {
        startTransition(async () => {
          await eliminarItem(itemId);
          router.refresh();
        });
      }}
      className={`flex h-7 w-7 shrink-0 items-center justify-center text-ink/35 transition-colors hover:bg-primary-pink/30 hover:text-ink focus-visible:bg-primary-pink/30 focus-visible:text-ink ${
        pendiente ? "opacity-50" : ""
      }`}
    >
      <IconoEliminar />
    </BotonConfirmar>
  );
}
