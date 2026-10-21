"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const NOMBRES: Record<string, string> = {
  es: "Español",
  en: "English",
};

/**
 * Cambiar el idioma de la interfaz.
 *
 * Reemplaza la URL en el mismo lugar donde estabas (el idioma vive en la
 * ruta, `/es/...` ↔ `/en/...`) y se lleva los parámetros de búsqueda: si
 * estabas filtrando el diario por categoría, seguís filtrando después de
 * cambiar. Cambia la interfaz, nunca lo que ya escribiste.
 */
export function SelectorIdioma() {
  const t = useTranslations("perfil");
  const activo = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendiente, startTransition] = useTransition();

  function cambiar(locale: string) {
    if (locale === activo) return;
    const query = Object.fromEntries(searchParams.entries());
    startTransition(() => {
      router.replace({ pathname, query }, { locale });
    });
  }

  return (
    <div role="radiogroup" aria-label={t("idioma")} className="grid grid-cols-2 gap-2">
      {routing.locales.map((locale) => {
        const esActivo = locale === activo;
        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={esActivo}
            disabled={pendiente}
            onClick={() => cambiar(locale)}
            className={`border-2 border-ink px-3 py-2 font-pixel text-[0.625rem] tracking-wide transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 ${
              esActivo
                ? "bg-secondary-turquoise text-ink-strong shadow-[3px_3px_0_var(--ink)]"
                : "bg-card text-ink"
            }`}
          >
            {(NOMBRES[locale] ?? locale).toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
