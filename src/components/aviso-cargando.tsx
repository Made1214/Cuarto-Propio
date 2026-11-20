"use client";

import { useTranslations } from "next-intl";

/**
 * El texto "cargando" de los esqueletos, solo para lectores de pantalla.
 *
 * Es de cliente a propósito: los `loading.tsx` no reciben `params`, así que
 * del lado del servidor no sabrían en qué idioma hablar sin ir a leer los
 * headers del request. El provider de next-intl del layout de `[locale]` ya
 * trae los mensajes al navegador, y desde acá se leen sin más.
 */
export function AvisoCargando() {
  const t = useTranslations("estados");
  return <span className="sr-only">{t("cargando")}</span>;
}
