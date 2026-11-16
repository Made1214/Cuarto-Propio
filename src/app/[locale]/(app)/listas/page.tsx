import { getTranslations } from "next-intl/server";
import { FiltroCategoria } from "@/components/filtro-categoria";
import { listarConFiltroCategoria } from "@/lib/categorias/filtro";
import { listarListas } from "@/lib/listas/queries";
import { ListaColumna } from "./lista-columna";
import { NuevaListaInline } from "./nueva-lista-inline";

/** Hasta cuántas listas se muestran abiertas de entrada. */
const LISTAS_ABIERTAS_MAXIMO = 6;

export default async function ListasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { locale } = await params;
  const { categoria: categoriaUrl } = await searchParams;
  const t = await getTranslations({ locale, namespace: "listas" });

  const {
    categorias,
    categoriaActual,
    resultado: listas,
  } = await listarConFiltroCategoria(categoriaUrl, (categoriaId) => listarListas({ categoriaId }));
  // Solo la categoría que de verdad existe: un id roto en la URL se trata
  // como si no hubiera filtro (ver `listarConFiltroCategoria`).
  const categoria = categoriaActual?.id;
  // Con pocas listas se ven todas abiertas; con muchas, plegadas (nombre y
  // progreso) para no montar miles de filas de una vez. Cada dispositivo
  // recuerda las que se abrieron a mano (src/lib/listas/plegado.ts).
  const abiertasPorDefecto = listas.length <= LISTAS_ABIERTAS_MAXIMO;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tema-titulo font-diario text-4xl font-bold text-secondary-purple">{t("titulo")}</h1>
          <p className="mt-1 text-sm text-muted/70">{t("subtitulo")}</p>
        </div>

        <NuevaListaInline />
      </div>

      <FiltroCategoria pathname="/listas" categorias={categorias} categoriaActualId={categoria ?? null} />

      {listas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-(length:--borde) border-dashed border-ink/40 bg-card/30 px-6 py-12 text-center">
          <svg width="28" height="28" viewBox="0 0 10 10" aria-hidden="true" className="text-secondary-purple">
            <rect x="0" y="0" width="3" height="3" fill="currentColor" />
            <rect x="5" y="1" width="5" height="1" fill="currentColor" />
            <rect x="0" y="4" width="3" height="3" fill="currentColor" />
            <rect x="5" y="5" width="5" height="1" fill="currentColor" />
            <rect x="0" y="8" width="3" height="2" fill="currentColor" />
            <rect x="5" y="8" width="5" height="1" fill="currentColor" />
          </svg>
          <p className="text-muted/70">{categoria ? t("sinResultados") : t("vacio")}</p>
          {categoria ? null : <NuevaListaInline />}
        </div>
      ) : null}

      {/* Columnas CSS (masonry): cada tarjeta ocupa solo el alto de su
          contenido y la siguiente se acomoda justo debajo — una lista larga
          no deja hueco bajo las cortas, como sí pasa con grid. */}
      <div className="columns-[17rem] gap-5">
        {listas.map((lista) => (
          <div key={lista.id} className="mb-5 break-inside-avoid">
            <ListaColumna lista={lista} categorias={categorias} abiertaPorDefecto={abiertasPorDefecto} />
          </div>
        ))}
      </div>
    </div>
  );
}
