"use client";

import { useLinkStatus } from "next/link";
import { Link, usePathname } from "@/i18n/navigation";

type Seccion = { href: string; label: string };

/**
 * Los links de la barra de menú (Diario, Listas, Vitrina, Audio).
 *
 * Es de cliente por dos cosas que el servidor no puede saber: en qué sección
 * se está ahora (el layout no se vuelve a renderizar al navegar, así que no
 * puede marcarla) y si el link que se acaba de tocar todavía está cargando.
 */
export function NavSecciones({ secciones }: { secciones: readonly Seccion[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6">
      {secciones.map((seccion) => {
        const activa = pathname === seccion.href || pathname.startsWith(`${seccion.href}/`);
        return (
          <Link
            key={seccion.href}
            href={seccion.href}
            // Precarga COMPLETA (datos incluidos), no solo hasta el
            // `loading.tsx`: son cuatro secciones que se visitan todo el
            // tiempo, así que pasar de una a otra ya encuentra la página
            // lista en vez de esperar al servidor. Cuánto dura lo precargado
            // lo fija `staleTimes.static` en next.config.ts. Solo en
            // producción: en `next dev` no se precarga nada.
            prefetch
            aria-current={activa ? "page" : undefined}
            className={`relative font-pixel text-xs tracking-wide transition-colors hover:text-secondary-purple ${
              activa ? "text-secondary-purple" : "text-muted/70"
            }`}
          >
            <EtiquetaSeccion label={seccion.label} />
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * La etiqueta y su cursor de "cargando". Tiene que ser un componente aparte,
 * hijo del `<Link>`: `useLinkStatus` lee el estado del link que lo contiene.
 *
 * Por qué hace falta aunque cada sección tenga su `loading.tsx`: el esqueleto
 * solo aparece en el acto si Next ya lo trajo por adelantado, y eso pasa
 * únicamente en producción (en `next dev` no hay prefetch) y si el prefetch
 * terminó antes del toque (celular con mala señal, o un toque apenas carga la
 * página). En ese hueco la pantalla anterior se quedaba quieta y parecía que
 * el toque no había hecho nada; ahora el destino se marca al instante. Si la
 * sección ya estaba precargada, `pending` ni se enciende y no se ve nada.
 */
function EtiquetaSeccion({ label }: { label: string }) {
  const { pending } = useLinkStatus();

  return (
    <>
      {/* Mientras carga, el destino ya se pinta como sección activa. */}
      <span className={pending ? "text-secondary-purple" : undefined}>{label.toUpperCase()}</span>
      {/* Un cursor de terminal que parpadea al lado: siempre presente y
          posicionado en el hueco entre links, para no mover la barra ni
          desbordarla en 360 px. El parpadeo, el retardo y la versión quieta
          para quien pidió menos movimiento están en `.cursor-pendiente`
          (globals.css). */}
      <span
        aria-hidden="true"
        data-pendiente={pending}
        className="cursor-pendiente absolute top-1/2 -right-2.5 h-2.5 w-1.5 -translate-y-1/2 bg-secondary-purple"
      />
    </>
  );
}
