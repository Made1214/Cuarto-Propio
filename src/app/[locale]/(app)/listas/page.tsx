import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import { listarCategorias } from "@/lib/categorias/queries";
import { listarListas } from "@/lib/listas/queries";
import { ListaColumna } from "./lista-columna";
import { NuevaListaInline } from "./nueva-lista-inline";

export default async function ListasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { locale } = await params;
  const { categoria } = await searchParams;
  const t = await getTranslations({ locale, namespace: "listas" });

  const [categorias, listas] = await Promise.all([
    listarCategorias(),
    listarListas({ categoriaId: categoria }),
  ]);

  const categoriaActual = categorias.find((cat) => cat.id === categoria) ?? null;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-diario text-4xl font-bold text-secondary-purple">{t("titulo")}</h1>
          <p className="mt-1 text-sm text-muted/70">{t("subtitulo")}</p>
        </div>

        <div className="flex flex-wrap items-end justify-end gap-3">
          {categorias.length > 0 ? (
            <details className="group relative">
              <summary className="marker:content-none flex w-64 cursor-pointer list-none items-center justify-between gap-2 border-2 border-ink bg-card px-4 py-2.5 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10 [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 items-center gap-2">
                  {categoriaActual ? (
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 border-2 border-ink-strong"
                      style={{ background: colorCategoria(categorias, categoriaActual.id) }}
                    />
                  ) : null}
                  <span className="truncate">
                    {(categoriaActual?.nombre ?? t("todasLasCategorias")).toUpperCase()}
                  </span>
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="shrink-0 transition-transform group-open:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="absolute right-0 z-20 mt-2 flex w-64 flex-col border-2 border-ink bg-card p-1 shadow-[4px_4px_0_var(--ink)]">
                <Link
                  href="/listas"
                  className="flex items-center gap-2 px-3 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
                >
                  {t("todasLasCategorias").toUpperCase()}
                </Link>
                {categorias.map((cat) => (
                  <Link
                    key={cat.id}
                    href={{ pathname: "/listas", query: { categoria: cat.id } }}
                    className="flex items-center gap-2 px-3 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
                  >
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 border-2 border-ink-strong"
                      style={{ background: colorCategoria(categorias, cat.id) }}
                    />
                    <span className="truncate">{cat.nombre.toUpperCase()}</span>
                  </Link>
                ))}
              </div>
            </details>
          ) : null}

          <NuevaListaInline />
        </div>
      </div>

      {listas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-ink/40 bg-card/30 px-6 py-12 text-center">
          <svg width="28" height="28" viewBox="0 0 10 10" aria-hidden="true" className="text-secondary-purple">
            <rect x="0" y="0" width="3" height="3" fill="currentColor" />
            <rect x="5" y="1" width="5" height="1" fill="currentColor" />
            <rect x="0" y="4" width="3" height="3" fill="currentColor" />
            <rect x="5" y="5" width="5" height="1" fill="currentColor" />
            <rect x="0" y="8" width="3" height="2" fill="currentColor" />
            <rect x="5" y="8" width="5" height="1" fill="currentColor" />
          </svg>
          <p className="text-muted/70">{categoria ? t("sinResultados") : t("vacio")}</p>
          {categoria ? null : <NuevaListaInline variante="panel" />}
        </div>
      ) : null}

      {/* Columnas CSS (masonry): cada tarjeta ocupa solo el alto de su
          contenido y la siguiente se acomoda justo debajo — una lista larga
          no deja hueco bajo las cortas, como sí pasa con grid. */}
      <div className="columns-[17rem] gap-5">
        {listas.map((lista) => (
          <div key={lista.id} className="mb-5 break-inside-avoid">
            <ListaColumna lista={lista} categorias={categorias} />
          </div>
        ))}
      </div>
    </div>
  );
}
