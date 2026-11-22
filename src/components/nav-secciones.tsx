"use client";

import { useLinkStatus } from "next/link";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { IconoSeccion } from "./icono-seccion";
import { IconoEscribir, type RutaSeccion } from "./iconos-secciones";
import { MenuCrear } from "./menu-crear";
import { pedirAccionPrincipal } from "@/lib/accion-principal";

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
        <BotonCentral pathname={pathname} />
      </div>
      {secciones.slice(mitad).map((seccion) => (
        <LinkSeccion key={seccion.href} seccion={seccion} activa={esActiva(seccion.href)} variante="inferior" />
      ))}
    </nav>
  );
}

/** Qué hace el botón del centro en cada sección: su acción principal, en un
 * toque y al alcance del pulgar (antes estaba arriba a la derecha, lo más
 * lejano en un celular sostenido con una mano). */
const ACCIONES_CENTRALES = {
  "/diario": { clave: "escribir", fondo: "bg-primary-pink" },
  "/listas": { clave: "nuevaLista", fondo: "bg-primary-green" },
  "/vitrina": { clave: "exhibir", fondo: "bg-secondary-turquoise" },
  "/audio": { clave: "grabar", fondo: "bg-primary-pink" },
} as const;

/**
 * En la portada de cada sección, el botón del centro hace la acción de esa
 * sección (Escribir, Nueva lista, Exhibir, Grabar), con su nombre debajo. En
 * las demás pantallas (una ficha, Personalización) es "Crear", con las
 * cuatro opciones. Al centro le queda igual de cerca a diestras y zurdas.
 */
function BotonCentral({ pathname }: { pathname: string }) {
  const t = useTranslations("nav");
  const ruta = pathname as keyof typeof ACCIONES_CENTRALES;
  const accion = ACCIONES_CENTRALES[ruta];
  if (!accion) return <MenuCrear variante="inferior" />;

  const contenido = (
    <>
      <span
        className={`-mt-7 flex h-13 w-13 items-center justify-center border-(length:--borde-grueso) border-ink rounded-theme ${accion.fondo} text-ink-strong shadow-marco-sm transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`}
      >
        {ruta === "/diario" ? <IconoEscribir tamano={24} /> : <IconoSeccion ruta={ruta} tamano={24} />}
      </span>
      {t(accion.clave)}
    </>
  );
  const clases = "flex flex-col items-center gap-1 text-xs font-bold whitespace-nowrap text-ink";

  if (ruta === "/diario") {
    return (
      <Link href="/diario/nueva" className={clases}>
        {contenido}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => pedirAccionPrincipal(ruta === "/listas" ? "listas" : ruta === "/vitrina" ? "vitrina" : "audio")}
      className={clases}
    >
      {contenido}
    </button>
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
