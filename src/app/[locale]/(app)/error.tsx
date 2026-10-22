"use client"; // Los límites de error de Next tienen que ser de cliente.

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { clasificarErrorAccion } from "@/lib/acciones/errores";
import {
  BOTON_AVISO_PRINCIPAL,
  BOTON_AVISO_SECUNDARIO,
  VentanaAviso,
} from "@/components/ventana-aviso";

/**
 * Lo que se ve cuando una pantalla de la app falla al cargar (casi siempre,
 * Supabase que no responde o la conexión que se cae en el celular).
 *
 * Vive a nivel de `(app)` y no repetido en cada sección: el aviso dice lo
 * mismo en todas, y como este límite no envuelve al layout de `(app)`, la
 * barra de navegación sigue en pie — se puede reintentar o irse a otra
 * sección sin recargar nada.
 *
 * Los textos salen de next-intl con el hook de cliente: el
 * `NextIntlClientProvider` del layout de `[locale]` envuelve a todo `(app)`,
 * así que los mensajes ya están en el navegador cuando esto se dibuja.
 */
export default function ErrorApp({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("estados");

  useEffect(() => {
    // A la consola del navegador y nada más: el contenido de la app es
    // íntimo y no se manda a ningún servicio de terceros. El `digest` es lo
    // que permite encontrar el mismo error en los logs del servidor.
    console.error(error);
  }, [error]);

  // Una Server Action que el servidor ya no reconoce (pestaña abierta desde
  // antes de un deploy) llega acá cuando la llama un formulario, como los del
  // Diario. Reintentar repetiría el mismo pedido viejo: lo que sirve es
  // recargar, para traer el código nuevo.
  if (clasificarErrorAccion(error) === "desactualizada") {
    return (
      <VentanaAviso
        rol="alert"
        barra={t("appActualizadaBarra")}
        titulo={t("appActualizadaTitulo")}
        mensaje={t("appActualizada")}
      >
        <button type="button" onClick={() => window.location.reload()} className={BOTON_AVISO_PRINCIPAL}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />
          </svg>
          {t("recargar").toUpperCase()}
        </button>
      </VentanaAviso>
    );
  }

  return (
    <VentanaAviso
      rol="alert"
      barra={t("errorBarra")}
      titulo={t("errorTitulo")}
      mensaje={t("errorMensaje")}
    >
      {/* `retry` y no `reset`: vuelve a pedirle los datos al servidor antes
          de redibujar. `reset` solo redibujaría con lo que ya falló. */}
      <button type="button" onClick={() => retry()} className={BOTON_AVISO_PRINCIPAL}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />
        </svg>
        {t("reintentar").toUpperCase()}
      </button>
      <Link href="/diario" className={BOTON_AVISO_SECUNDARIO}>
        {t("volverAlDiario").toUpperCase()}
      </Link>
      {error.digest ? (
        <p className="w-full font-pixel text-[0.625rem] tracking-wide text-muted/50">
          {t("codigoError", { codigo: error.digest })}
        </p>
      ) : null}
    </VentanaAviso>
  );
}
