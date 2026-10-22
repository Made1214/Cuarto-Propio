"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BOTON_AVISO_PRINCIPAL, VentanaAviso } from "@/components/ventana-aviso";

/**
 * Cuando `page.tsx` (o `editar/page.tsx`) llama a `notFound()` porque el
 * código no corresponde a ninguna entrada: lo normal es un enlace viejo a
 * algo que ya se borró. En vez de la pantalla genérica de Next, un aviso
 * con la cara de la app y el camino de vuelta al diario.
 *
 * De cliente solo para leer los textos: `not-found.tsx` no recibe `params`,
 * y el hook toma el idioma del provider de `[locale]` sin ir a los headers.
 */
export default function EntradaNoEncontrada() {
  const t = useTranslations("estados");

  return (
    <VentanaAviso
      barra={t("noEncontradoBarra")}
      titulo={t("noEncontradoTitulo")}
      mensaje={t("noEncontradaEntrada")}
    >
      <Link href="/diario" className={BOTON_AVISO_PRINCIPAL}>
        {t("volverAlDiario").toUpperCase()}
      </Link>
    </VentanaAviso>
  );
}
