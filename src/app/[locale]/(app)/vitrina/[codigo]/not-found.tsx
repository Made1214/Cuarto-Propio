"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BOTON_AVISO_PRINCIPAL, VentanaAviso } from "@/components/ventana-aviso";

/**
 * Cuando la ficha (o su pantalla de edición) llama a `notFound()` porque el
 * código no corresponde a ninguna pieza — típicamente, una pieza que se
 * descolgó y alguien volvió a abrir desde el historial. Mismo criterio que
 * en el Diario: aviso con la cara de la app y el camino de vuelta.
 */
export default function PiezaNoEncontrada() {
  const t = useTranslations("estados");

  return (
    <VentanaAviso
      barra={t("noEncontradoBarra")}
      titulo={t("noEncontradoTitulo")}
      mensaje={t("noEncontradaPieza")}
    >
      <Link href="/vitrina" className={BOTON_AVISO_PRINCIPAL}>
        {t("volverALaVitrina")}
      </Link>
    </VentanaAviso>
  );
}
