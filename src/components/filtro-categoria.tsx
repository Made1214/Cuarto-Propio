import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import type { Categoria } from "@/lib/categorias/types";

/** Clases compartidas por todos los chips de filtro de la app (categorías
 * acá, hashtags en la Vitrina): misma altura, mismo texto, mismo estado
 * activo, para que filtrar se lea igual en todos los módulos. */
export const CLASE_CHIP =
  "tema-chip flex h-9 shrink-0 items-center gap-2 border-(length:--borde) border-ink rounded-theme px-3 text-[13px] whitespace-nowrap transition-colors";
export const CLASE_CHIP_ACTIVO = "tema-chip-activo bg-secondary-purple font-semibold text-background";
export const CLASE_CHIP_INACTIVO = "bg-card font-medium text-ink hover:bg-primary-pink/30";

/**
 * El filtro por categoría de Diario, Listas, Vitrina y Audio: una fila de
 * chips, cada uno con el color de su categoría.
 *
 * Chips y no un desplegable: se ve de un vistazo qué categorías hay y cuál
 * está elegida, y cambiar es un solo toque en vez de dos. Para que muchas
 * categorías no rompan el layout, en el celular la fila se desliza de lado
 * (sale hasta el borde de la pantalla, así se nota que sigue); desde `sm`
 * se acomoda en varias líneas.
 *
 * Son links comunes (`?categoria=`), así que funcionan sin JavaScript y el
 * botón "atrás" deshace el filtro.
 */
export function FiltroCategoria({
  pathname,
  categorias,
  categoriaActualId,
  conservar,
}: {
  pathname: string;
  categorias: Categoria[];
  /** La categoría vigente, ya validada contra `categorias` en el servidor. */
  categoriaActualId: string | null;
  /** Los otros filtros de la página (la búsqueda, el hashtag), que elegir
   * una categoría no tiene que borrar. Nunca `hasta`: cambiar de filtro
   * vuelve a la primera tanda. */
  conservar?: Record<string, string>;
}) {
  const t = useTranslations("nav");
  if (categorias.length === 0) return null;

  return (
    <nav aria-label={t("filtrarCategoria")} className="tema-fila-chips -mx-5 sm:mx-0">
      <ul className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <li>
          <Link
            href={{ pathname, query: conservar ?? {} }}
            aria-current={categoriaActualId ? undefined : "page"}
            className={`${CLASE_CHIP} ${categoriaActualId ? CLASE_CHIP_INACTIVO : CLASE_CHIP_ACTIVO}`}
          >
            {t("todas")}
          </Link>
        </li>
        {categorias.map((cat) => {
          const activa = cat.id === categoriaActualId;
          return (
            <li key={cat.id}>
              <Link
                href={{ pathname, query: { ...conservar, categoria: cat.id } }}
                aria-current={activa ? "page" : undefined}
                className={`${CLASE_CHIP} ${activa ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO}`}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 border-[1.5px] border-ink-strong"
                  style={{ background: colorCategoria(categorias, cat.id) }}
                />
                <span className="max-w-48 truncate">{cat.nombre}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
