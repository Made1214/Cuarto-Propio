"use client"; // Los límites de error de Next tienen que ser de cliente.

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { BOTON_AVISO_PRINCIPAL, VentanaAviso } from "@/components/ventana-aviso";

/**
 * La red de abajo de `(app)/error.tsx`: atrapa lo que ese límite no puede,
 * porque un `error.tsx` no envuelve al layout de su propio segmento. Acá
 * caen sobre todo las fallas del layout de `(app)` (Supabase que no
 * responde al pedir la sesión o el perfil), y de paso las de la página de
 * inicio que redirige y las del login.
 *
 * Sigue adentro del layout de `[locale]` — que es el layout raíz y este
 * límite no lo envuelve —, así que el `NextIntlClientProvider` ya está
 * arriba y los textos salen traducidos como en el resto de los avisos.
 *
 * Solo ofrece reintentar, a propósito: lo que falló es el marco que
 * comparten todas las secciones, así que un enlace al diario (o a cualquier
 * otra) volvería a pasar por el mismo layout y terminaría acá de nuevo. Y
 * mandar al login sería engañoso: la sesión no se perdió, lo que no
 * respondió fue el servidor.
 */
export default function ErrorLocale({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("estados");

  useEffect(() => {
    // Igual que en `(app)/error.tsx`: solo a la consola, nunca a un
    // servicio de terceros. El `digest` cruza con los logs del servidor.
    console.error(error);
  }, [error]);

  return (
    // Sin el layout de `(app)` no hay barra ni `<main>` que centren el
    // aviso: este envoltorio repone los mismos márgenes.
    <main className="flex flex-1 flex-col bg-background px-6 py-10 text-foreground">
      <VentanaAviso
        rol="alert"
        barra={t("errorBarra")}
        titulo={t("errorTitulo")}
        mensaje={t("errorMensaje")}
      >
        {/* `retry` y no `reset`: vuelve a pedirle todo al servidor (sesión
            y perfil incluidos) antes de redibujar. */}
        <button type="button" onClick={() => retry()} className={BOTON_AVISO_PRINCIPAL}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />
          </svg>
          {t("reintentar").toUpperCase()}
        </button>
        {error.digest ? (
          <p className="w-full font-pixel text-[0.625rem] tracking-wide text-muted/50">
            {t("codigoError", { codigo: error.digest })}
          </p>
        ) : null}
      </VentanaAviso>
    </main>
  );
}
