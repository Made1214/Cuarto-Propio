"use client";

import { useLinkStatus } from "next/link";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { IconoSeccion } from "./icono-seccion";
import type { RutaSeccion } from "./iconos-secciones";
import { MenuCrear } from "./menu-crear";

type Seccion = { href: RutaSeccion; label: string };

/**
 * Los links de las cuatro secciones (Diario, Listas, Vitrina, Audio), con
 * ícono y texto legible — nada de etiquetas pixeladas de 12 px en mayúsculas.
 *
 * Dos variantes de la misma navegación:
 * - `barra`: dentro de la barra morada de arriba, desde tablet (`md`).
 * - `inferior`: fija abajo en el celular, al alcance del pulgar, con el botón
 *   "Crear" levantado en el medio.
 *
 * Es de cliente por dos cosas que el servidor no puede saber: en qué sección
 * se está ahora (el layout no se vuelve a renderizar al navegar, así que no
 * puede marcarla) y si el link que se acaba de tocar todavía está cargando.
 */
export function NavSecciones({
  secciones,
  variante,
}: {
  secciones: readonly Seccion[];
  variante: "barra" | "inferior";
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const esActiva = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  if (variante === "barra") {
    return (
      <nav aria-label={t("secciones")} className="hidden items-center gap-1 md:flex">
        {secciones.map((seccion) => (
          <LinkSeccion key={seccion.href} seccion={seccion} activa={esActiva(seccion.href)} variante="barra" />
        ))}
      </nav>
    );
  }

  // Modo enfocado: mientras se escribe o se edita algo, la barra de abajo se
  // esconde para dejarle toda la pantalla (y el teclado) al contenido. Para
  // salir está el "volver" de cada pantalla.
  if (pathname.endsWith("/nueva") || pathname.endsWith("/editar")) return null;

  // En el celular: dos secciones, Crear, dos secciones.
  const mitad = Math.ceil(secciones.length / 2);
  return (
    <nav
      aria-label={t("secciones")}
      className="tema-nav-inferior fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-end border-t-(length:--borde-grueso) border-ink bg-card pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden"
    >
      {secciones.slice(0, mitad).map((seccion) => (
        <LinkSeccion key={seccion.href} seccion={seccion} activa={esActiva(seccion.href)} variante="inferior" />
      ))}
      <div className="flex justify-center">
        <MenuCrear variante="inferior" />
      </div>
      {secciones.slice(mitad).map((seccion) => (
        <LinkSeccion key={seccion.href} seccion={seccion} activa={esActiva(seccion.href)} variante="inferior" />
      ))}
    </nav>
  );
}

function LinkSeccion({
  seccion,
  activa,
  variante,
}: {
  seccion: Seccion;
  activa: boolean;
  variante: "barra" | "inferior";
}) {
  const clases =
    variante === "barra"
      ? `tema-nav-link relative flex h-10 items-center gap-2 border-(length:--borde) px-3.5 text-sm transition-colors ${
          activa
            ? "border-ink bg-background font-bold text-foreground"
            : "border-transparent font-medium text-background hover:bg-background/15"
        }`
      : `relative flex flex-col items-center gap-1 py-1 text-xs ${
          activa ? "font-bold text-secondary-purple" : "font-medium text-ink"
        }`;

  return (
    <Link
      href={seccion.href}
      // Sin `prefetch` (precarga completa, datos incluidos) a propósito: con
      // ella, una sección a la que se llegaba desde esta barra quedaba
      // servida desde lo precargado y no tomaba el `refresh()` de sus
      // actions — se creaba una lista y no aparecía hasta recargar. La
      // precarga por defecto (hasta el `loading.tsx`) alcanza para que el
      // esqueleto salga al instante.
      aria-current={activa ? "page" : undefined}
      className={clases}
    >
      <ContenidoSeccion seccion={seccion} activa={activa} variante={variante} />
    </Link>
  );
}

/**
 * Ícono, etiqueta y el cursor de "cargando". Tiene que ser un componente
 * aparte, hijo del `<Link>`: `useLinkStatus` lee el estado del link que lo
 * contiene.
 *
 * Por qué hace falta aunque cada sección tenga su `loading.tsx`: el esqueleto
 * solo aparece en el acto si Next ya lo trajo por adelantado, y eso pasa
 * únicamente en producción y si el prefetch terminó antes del toque (celular
 * con mala señal). En ese hueco la pantalla anterior se quedaba quieta y
 * parecía que el toque no había hecho nada; ahora el destino se marca al
 * instante. Si la sección ya estaba precargada, `pending` ni se enciende.
 */
function ContenidoSeccion({
  seccion,
  activa,
  variante,
}: {
  seccion: Seccion;
  activa: boolean;
  variante: "barra" | "inferior";
}) {
  const { pending } = useLinkStatus();

  if (variante === "barra") {
    return (
      <>
        <IconoSeccion ruta={seccion.href} tamano={20} />
        {seccion.label}
        {/* Cursor de terminal que parpadea mientras carga (ver
            `.cursor-pendiente` en globals.css). Siempre en el DOM, así no
            mueve nada al aparecer. */}
        <span
          aria-hidden="true"
          data-pendiente={pending}
          className="cursor-pendiente absolute top-1/2 right-1 h-2.5 w-1 -translate-y-1/2 bg-current"
        />
      </>
    );
  }

  return (
    <>
      {/* La rayita rosada marca la sección activa; mientras carga la que se
          acaba de tocar, parpadea ahí mismo. */}
      <span
        aria-hidden="true"
        data-pendiente={pending}
        className={`h-[3px] w-6 ${activa ? "bg-primary-pink" : "cursor-pendiente bg-primary-pink"}`}
      />
      <IconoSeccion ruta={seccion.href} tamano={24} />
      {seccion.label}
    </>
  );
}
