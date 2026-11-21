import { getFormatter } from "next-intl/server";
import { colorCategoria } from "@/lib/categorias/color";
import type { Categoria } from "@/lib/categorias/types";

/** Fecha y categoría de una entrada, igual al leerla y al editarla. */
export async function MetaEntrada({
  fecha,
  categoriaId,
  categoriaNombre,
  categorias,
  locale,
}: {
  fecha: string;
  categoriaId: string | null;
  categoriaNombre: string | null;
  categorias: Categoria[];
  locale: string;
}) {
  const format = await getFormatter({ locale });
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <time dateTime={fecha} className="apoyo font-semibold">
        {format.dateTime(new Date(fecha), { dateStyle: "full" })}
      </time>
      {categoriaNombre && categoriaId ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <span aria-hidden="true" className="punto-categoria" style={{ background: colorCategoria(categorias, categoriaId) }} />
          {categoriaNombre}
        </span>
      ) : null}
    </div>
  );
}
