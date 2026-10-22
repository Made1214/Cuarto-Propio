import { getFormatter, getTranslations } from "next-intl/server";
import { CargarMas, FinDeLista } from "@/components/cargar-mas";
import { FiltroCategoria } from "@/components/filtro-categoria";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import { listarConFiltroCategoria } from "@/lib/categorias/filtro";
import { listarEntradas } from "@/lib/diario/queries";
import { Buscador } from "./buscador";
import { ResultadosBusqueda, ZonaBusqueda } from "./busqueda-pendiente";

export default async function DiarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; categoria?: string; hasta?: string }>;
}) {
  const { locale } = await params;
  const { q, categoria: categoriaUrl, hasta } = await searchParams;
  const t = await getTranslations({ locale, namespace: "diario" });
  const format = await getFormatter({ locale });

  const busqueda = q?.trim() ?? "";

  const {
    categorias,
    categoriaActual,
    resultado: pagina,
  } = await listarConFiltroCategoria(categoriaUrl, (categoriaId) =>
    // El total solo se cuenta si se va a mostrar, o sea, al filtrar.
    listarEntradas({ categoriaId, busqueda: q, hasta, contar: Boolean(busqueda || categoriaId) }),
  );

  // De acá en más, solo la categoría que de verdad existe: un id roto en la
  // URL se trata como si no hubiera filtro (ver `listarConFiltroCategoria`).
  const categoria = categoriaActual?.id;
  const hayFiltro = Boolean(busqueda || categoria);
  const entradas = pagina.filas;
  // Los filtros vigentes viajan con el "cargar más"; `hasta` no viaja en los
  // links de filtro, así que cambiar de filtro vuelve a la primera tanda.
  const filtrosActuales: Record<string, string> = {
    ...(busqueda ? { q: busqueda } : {}),
    ...(categoria ? { categoria } : {}),
  };

  // Agrupado por mes: un diario se recorre por épocas, no como una lista
  // plana. Las entradas ya vienen de más nueva a más vieja.
  const grupos: { clave: string; etiqueta: string; entradas: typeof entradas }[] = [];
  for (const entrada of entradas) {
    const fecha = new Date(entrada.fecha);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
    const ultimo = grupos.at(-1);
    if (ultimo?.clave === clave) {
      ultimo.entradas.push(entrada);
    } else {
      grupos.push({
        clave,
        etiqueta: format.dateTime(fecha, { month: "long", year: "numeric" }),
        entradas: [entrada],
      });
    }
  }

  return (
    <ZonaBusqueda>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <svg width="20" height="20" viewBox="0 0 10 10" aria-hidden="true" className="mt-1 shrink-0">
              <rect x="4" y="0" width="2" height="2" fill="var(--secondary-turquoise)" />
              <rect x="2" y="2" width="6" height="2" fill="var(--secondary-turquoise)" />
              <rect x="0" y="4" width="10" height="2" fill="var(--secondary-turquoise)" />
              <rect x="2" y="6" width="6" height="2" fill="var(--secondary-turquoise)" />
              <rect x="4" y="8" width="2" height="2" fill="var(--secondary-turquoise)" />
            </svg>
            <div>
              <h1 className="font-diario text-4xl font-bold text-secondary-purple">{t("titulo")}</h1>
              <p className="mt-1 text-sm text-muted/70">{t("subtitulo")}</p>
            </div>
          </div>
          <Link
            href="/diario/nueva"
            className="flex shrink-0 items-center gap-2 border-2 border-ink bg-primary-green px-4 py-2.5 font-pixel text-xs tracking-wide text-ink-strong shadow-[4px_4px_0_var(--ink)] transition-[transform,filter] hover:brightness-95 active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("nuevaEntrada").toUpperCase()}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Buscador valorInicial={busqueda} categoria={categoria} />

          <span className="h-6 w-0.75 bg-ink" aria-hidden="true" />

          <FiltroCategoria
            pathname="/diario"
            categorias={categorias}
            categoriaActualId={categoria ?? null}
            conservar={busqueda ? { q: busqueda } : undefined}
            etiquetaTodas={t("todasLasCategorias")}
            ancho="w-72"
            iconoTodas
          />
        </div>

        {/* Todo lo que responde a la búsqueda se atenúa mientras viaja la
            nueva (ver `ZonaBusqueda`). */}
        <ResultadosBusqueda>
          {/* Qué está filtrando ahora mismo, y cómo salirse de cada cosa. */}
          {hayFiltro ? (
            <div className="flex flex-wrap items-center gap-2">
              {busqueda ? (
                <Link
                  href={{ pathname: "/diario", query: categoria ? { categoria } : {} }}
                  className="flex items-center gap-2 border-2 border-ink bg-card px-2.5 py-1 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-primary-pink/30"
                >
                  <span className="max-w-40 truncate">“{busqueda}”</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </Link>
              ) : null}

              {categoriaActual ? (
                <Link
                  href={{ pathname: "/diario", query: busqueda ? { q: busqueda } : {} }}
                  className="flex items-center gap-2 border-2 border-ink-strong px-2.5 py-1 font-pixel text-xs tracking-wide text-ink-strong transition-[filter] hover:brightness-95"
                  style={{ background: colorCategoria(categorias, categoriaActual.id) }}
                >
                  <span className="max-w-40 truncate">{categoriaActual.nombre.toUpperCase()}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </Link>
              ) : null}

              <span className="font-pixel text-xs text-muted/70 tabular-nums">
                {t("resultados", { cantidad: pagina.total ?? entradas.length })}
              </span>
            </div>
          ) : null}

          {entradas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border-2 border-dashed border-ink/40 bg-card/30 px-6 py-12 text-center">
              <svg width="28" height="28" viewBox="0 0 10 10" aria-hidden="true" className="text-secondary-purple">
                <rect x="4" y="0" width="2" height="2" fill="currentColor" />
                <rect x="2" y="2" width="6" height="2" fill="currentColor" />
                <rect x="0" y="4" width="10" height="2" fill="currentColor" />
                <rect x="2" y="6" width="6" height="2" fill="currentColor" />
                <rect x="4" y="8" width="2" height="2" fill="currentColor" />
              </svg>
              <p className="text-muted/70">{hayFiltro ? t("sinResultados") : t("vacio")}</p>
              {hayFiltro ? (
                <Link
                  href="/diario"
                  className="border-2 border-ink bg-card px-4 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
                >
                  {t("limpiarFiltros").toUpperCase()}
                </Link>
              ) : (
                <Link
                  href="/diario/nueva"
                  className="border-2 border-ink bg-primary-green px-5 py-3 font-pixel text-xs tracking-wide text-ink-strong shadow-[4px_4px_0_var(--ink)] transition-[filter] hover:brightness-95"
                >
                  {t("nuevaEntrada").toUpperCase()}
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {grupos.map((grupo) => (
                <section key={grupo.clave} className="flex flex-col gap-4">
                  <h2 className="flex items-center gap-3 font-pixel text-xs tracking-wide text-muted/70">
                    <span>{grupo.etiqueta.toUpperCase()}</span>
                    <span className="h-0.5 flex-1 bg-ink/15" aria-hidden="true" />
                  </h2>

                  <ul className="flex flex-col gap-5">
                    {grupo.entradas.map((entrada) => (
                      <li key={entrada.id}>
                        <Link
                          href={`/diario/${entrada.codigo}`}
                          className="relative block border-2 border-ink bg-card p-6 shadow-[5px_5px_0_var(--ink)] transition-transform hover:-translate-y-0.5"
                        >
                          {entrada.categoria ? (
                            <span
                              aria-hidden="true"
                              className="absolute -top-0.5 -right-0.5 h-4 w-4 border-2 border-ink-strong border-t-0 border-r-0"
                              style={{ background: colorCategoria(categorias, entrada.categoria.id) }}
                            />
                          ) : null}
                          <div className="flex items-center justify-between gap-3">
                            <time
                              dateTime={entrada.fecha}
                              className="font-pixel text-xs tracking-wide text-muted/70"
                            >
                              {format
                                .dateTime(new Date(entrada.fecha), { day: "numeric", month: "short" })
                                .toUpperCase()}
                            </time>
                            {entrada.categoria ? (
                              <span
                                className="border-2 border-ink-strong px-2.5 py-1 font-pixel text-xs tracking-wide text-ink-strong"
                                style={{ background: colorCategoria(categorias, entrada.categoria.id) }}
                              >
                                {entrada.categoria.nombre.toUpperCase()}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-2 font-diario text-xl font-semibold">
                            {entrada.titulo || t("sinTitulo")}
                          </h3>
                          {entrada.extracto ? (
                            <p className="mt-1 line-clamp-2 text-sm text-muted/70">{entrada.extracto}</p>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              {pagina.siguiente ? (
                <CargarMas
                  pathname="/diario"
                  query={{ ...filtrosActuales, hasta: pagina.siguiente }}
                />
              ) : pagina.conCursor ? (
                <FinDeLista />
              ) : null}
            </div>
          )}
        </ResultadosBusqueda>
      </div>
    </ZonaBusqueda>
  );
}
