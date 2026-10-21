import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import { listarCategorias } from "@/lib/categorias/queries";
import { listarHashtags, listarImagenes } from "@/lib/imagenes/queries";
import { ExhibirPiezas } from "./exhibir-piezas";
import { IconoVitrina } from "./iconos";
import { VentanaImagen } from "./ventana-imagen";

export default async function VitrinaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hashtag?: string; categoria?: string }>;
}) {
  const { locale } = await params;
  const { hashtag, categoria } = await searchParams;
  const t = await getTranslations({ locale, namespace: "vitrina" });

  const [categorias, hashtags, imagenes] = await Promise.all([
    listarCategorias(),
    listarHashtags(),
    listarImagenes({ hashtag, categoriaId: categoria }),
  ]);

  const hayFiltro = Boolean(hashtag || categoria);
  const categoriaActual = categorias.find((cat) => cat.id === categoria) ?? null;
  // Lo que hay que conservar al tocar el OTRO filtro, para que elegir un
  // hashtag no borre la categoría elegida y viceversa.
  const soloCategoria = categoria ? { categoria } : {};
  const soloHashtag = hashtag ? { hashtag } : {};

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="mt-1 shrink-0 text-secondary-turquoise">
            <IconoVitrina />
          </span>
          <div>
            <h1 className="font-diario text-4xl font-bold text-secondary-purple">{t("titulo")}</h1>
            <p className="mt-1 text-sm text-muted/70">{t("subtitulo")}</p>
          </div>
        </div>

        <ExhibirPiezas />
      </div>

      {/* Los hashtags son la etiqueta fina de la Vitrina y van como chips a la
          vista (suelen ser pocos y se tocan seguido); la categoría, que es
          compartida con los otros módulos y puede crecer mucho, va en un
          desplegable — igual que en Diario y Listas. */}
      {categorias.length > 0 || hashtags.length > 0 ? (
        <div className="flex flex-wrap items-start gap-3">
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
              <div className="absolute z-20 mt-2 flex w-64 flex-col border-2 border-ink bg-card p-1 shadow-[4px_4px_0_var(--ink)]">
                <Link
                  href={{ pathname: "/vitrina", query: soloHashtag }}
                  className="flex items-center gap-2 px-3 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
                >
                  {t("todasLasCategorias").toUpperCase()}
                </Link>
                {categorias.map((cat) => (
                  <Link
                    key={cat.id}
                    href={{ pathname: "/vitrina", query: { ...soloHashtag, categoria: cat.id } }}
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

          {hashtags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {hashtags.map((etiqueta) => {
                const activo = etiqueta.nombre === hashtag;
                return (
                  <Link
                    key={etiqueta.nombre}
                    // Tocar el hashtag ya activo lo apaga: el chip es el
                    // interruptor, no hay que buscar otro lugar para quitarlo.
                    href={{
                      pathname: "/vitrina",
                      query: activo
                        ? soloCategoria
                        : { ...soloCategoria, hashtag: etiqueta.nombre },
                    }}
                    className={`flex items-center gap-1.5 border-2 px-2.5 py-1.5 font-pixel text-xs tracking-wide transition-colors ${
                      activo
                        ? "border-ink-strong bg-secondary-turquoise text-ink-strong"
                        : "border-ink/30 text-ink hover:border-ink hover:bg-secondary-turquoise/20"
                    }`}
                  >
                    #{etiqueta.nombre}
                    <span className="tabular-nums opacity-60">{etiqueta.cantidad}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {hayFiltro ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-pixel text-xs text-muted/70 tabular-nums">
            {t("resultados", { cantidad: imagenes.length })}
          </span>
          <Link
            href="/vitrina"
            className="border-2 border-ink bg-card px-2.5 py-1 font-pixel text-[10px] tracking-wide text-ink transition-colors hover:bg-primary-pink/30"
          >
            {t("limpiarFiltros").toUpperCase()}
          </Link>
        </div>
      ) : null}

      {imagenes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-ink/40 bg-card/30 px-6 py-12 text-center">
          <span className="text-secondary-purple">
            <IconoVitrina />
          </span>
          <p className="text-muted/70">{hayFiltro ? t("sinResultados") : t("vacio")}</p>
          {hayFiltro ? (
            <Link
              href="/vitrina"
              className="border-2 border-ink bg-card px-4 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
            >
              {t("limpiarFiltros").toUpperCase()}
            </Link>
          ) : (
            <ExhibirPiezas variante="panel" />
          )}
        </div>
      ) : (
        /* Columnas CSS (masonry) como en Listas: cada ventana ocupa el alto de
           su foto y la siguiente se acomoda justo debajo, sin recortar ni
           dejar huecos — que es lo que hace que una cuadrícula estilo
           Pinterest se vea como tal. */
        <div className="columns-[15rem] gap-5 lg:columns-[17rem]">
          {imagenes.map((imagen) => (
            <div key={imagen.id} className="mb-5 break-inside-avoid">
              <VentanaImagen locale={locale} imagen={imagen} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
