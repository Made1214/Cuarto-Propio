"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { useAlternarModo } from "@/lib/temas/use-modo";

const CLASE =
  "flex h-11 min-w-11 items-center justify-center border-(length:--borde) border-background/50 rounded-theme px-2.5 text-xs font-bold text-background transition-colors hover:bg-background/15";

/**
 * Idioma y modo claro/oscuro en las pantallas de acceso: quien llega por
 * primera vez puede no haber pasado por la landing, y antes no tenía cómo
 * cambiar ninguno de los dos sin entrar. Conserva la query (`?next=`,
 * `?tema=`) al cambiar de idioma.
 */
export function ControlesAcceso() {
  const t = useTranslations("login");
  const locale = useLocale();
  const pathname = usePathname();
  const query = Object.fromEntries(useSearchParams());
  const otro = locale === "es" ? "en" : "es";
  const [oscuro, alternar] = useAlternarModo();

  return (
    <div className="flex items-center gap-2">
      <Link
        href={{ pathname, query }}
        locale={otro}
        hrefLang={otro}
        aria-label={t("cambiarIdioma")}
        className={CLASE}
      >
        {otro.toUpperCase()}
      </Link>
      <button type="button" onClick={alternar} aria-pressed={oscuro} aria-label={t("modoClaroOscuro")} className={CLASE}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          {oscuro ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
            </>
          ) : (
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          )}
        </svg>
      </button>
    </div>
  );
}
