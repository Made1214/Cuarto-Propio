import { getFormatter, getTranslations } from "next-intl/server";
import { CargarMas, FinDeLista } from "@/components/cargar-mas";
import { FiltroCategoria } from "@/components/filtro-categoria";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import { listarConFiltroCategoria } from "@/lib/categorias/filtro";
import { contarEntradasDiario, listarEntradas, mesValido } from "@/lib/diario/queries";
import { Buscador } from "./buscador";
import { ColumnaFiltros, SIN_CATEGORIA } from "./columna-filtros";
import { ResultadosBusqueda, ZonaBusqueda } from "./busqueda-pendiente";

export default async function DiarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; categoria?: string; mes?: string; hasta?: string }>;
}) {
  const { locale } = await params;
  const { q, categoria: categoriaUrl, mes: mesUrl, hasta } = await searchParams;
  const t = await getTranslations({ locale, namespace: "diario" });
  const format = await getFormatter({ locale });

  const busqueda = q?.trim() ?? "";

  // `?categoria=ninguna` es "sin categoría"; `?mes=` solo vale con forma YYYY-MM.
  const sinCategoria = categoriaUrl === SIN_CATEGORIA;
  const mes = mesValido(mesUrl);

  const [{ categorias, categoriaActual, resultado: pagina }, conteos] = await Promise.all([
    listarConFiltroCategoria(sinCategoria ? undefined : categoriaUrl, (categoriaId) =>
      // El total solo se cuenta si se va a mostrar, o sea, al filtrar.
      listarEntradas({
        categoriaId,
        sinCategoria,
        mes,
        busqueda: q,
        hasta,
        contar: Boolean(busqueda || categoriaId || sinCategoria || mes),
      }),
    ),
    contarEntradasDiario(),
  ]);

  // De acá en más, solo la categoría que de verdad existe: un id roto en la
  // URL se trata como si no hubiera filtro (ver `listarConFiltroCategoria`).
  const categoria = categoriaActual?.id;
  const categoriaParam = sinCategoria ? SIN_CATEGORIA : categoria;
  const hayFiltro = Boolean(busqueda || categoriaParam || mes);
  const entradas = pagina.filas;
  // Los filtros vigentes viajan con el "cargar más"; `hasta` no viaja en los
  // links de filtro, así que cambiar de filtro vuelve a la primera tanda.
  const filtrosActuales: Record<string, string> = {
    ...(busqueda ? { q: busqueda } : {}),
    ...(categoriaParam ? { categoria: categoriaParam } : {}),
    ...(mes ? { mes } : {}),
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
      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-x-10 gap-y-5 lg:max-w-280 lg:grid-cols-[16.25rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:content-start">
        <div className="encabezado-seccion lg:col-start-2">
          <h1 className="tema-titulo titulo-seccion">{t("titulo")}</h1>
          <div className="acciones-seccion">
            <Link
              href="/diario/nueva"
              className="boton boton-rosa"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="hidden sm:inline">{t("nuevaEntrada")}</span>
              <span className="sm:hidden">{t("nueva")}</span>
            </Link>
          </div>
          <p className="subtitulo-seccion">{t("subtitulo")}</p>
        </div>

        <ColumnaFiltros
          buscador={<Buscador valorInicial={busqueda} categoria={categoriaParam} mes={mes} />}
          categorias={categorias}
          conteos={conteos}
          actuales={{ q: busqueda || undefined, categoria: categoriaParam, mes }}
        />

        {/* Por debajo de `lg` la columna es solo el buscador y los chips la
            completan; desde `lg` las categorías van en la columna. */}
        <div className="empty:hidden lg:hidden">
          <FiltroCategoria
            pathname="/diario"
            categorias={categorias}
            categoriaActualId={categoria ?? null}
            conservar={{ ...(busqueda ? { q: busqueda } : {}), ...(mes ? { mes } : {}) }}
          />
        </div>

        {/* Todo lo que responde a la búsqueda se atenúa mientras viaja la
            nueva (ver `ZonaBusqueda`). */}
        <ResultadosBusqueda className="lg:col-start-2">
          {/* Cuántas entradas quedan con el filtro, y cómo salirse de todo
              de una vez. La categoría ya se ve marcada en los chips. */}
          {hayFiltro ? (
            <p className="text-sm text-muted/80">
              <span className="font-semibold tabular-nums">
                {t("resultados", { cantidad: pagina.total ?? entradas.length })}
              </span>
              {busqueda ? <> {t("conLaPalabra", { palabra: busqueda })}</> : null}
              {" · "}
              <Link href="/diario" className="font-semibold text-secondary-purple underline-offset-2 hover:underline">
                {t("limpiarFiltros")}
              </Link>
            </p>
          ) : null}

          {entradas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border-(length:--borde) border-dashed border-ink/40 bg-card/30 px-6 py-12 text-center">
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
                  className="boton"
                >
                  {t("limpiarFiltros")}
                </Link>
              ) : (
                <Link
                  href="/diario/nueva"
                  className="boton boton-rosa"
                >
                  {t("nuevaEntrada")}
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {grupos.map((grupo) => (
                <section key={grupo.clave} className="flex flex-col gap-4">
                  <h2 className="flex items-center gap-3">
                    <span className="rotulo">
                      {grupo.etiqueta}
                    </span>
                    <span className="h-0.5 flex-1 bg-ink/15" aria-hidden="true" />
                    <span className="text-xs text-muted/75">
                      {t("resultados", { cantidad: grupo.entradas.length })}
                    </span>
                  </h2>

                  <ul className="flex flex-col gap-5">
                    {grupo.entradas.map((entrada) => (
                      <li key={entrada.id}>
                        {/* La fecha es el ancla visual de la tarjeta (el
                            diario se recorre por días), la categoría va como
                            un punto de color sobre el título y el extracto
                            en la letra del diario. */}
                        <Link
                          href={`/diario/${entrada.codigo}`}
                          className="tema-panel flex gap-4 border-(length:--borde) border-ink rounded-theme bg-card p-4 shadow-marco transition-transform hover:-translate-y-0.5 sm:gap-5 sm:p-5"
                        >
                          <time
                            dateTime={entrada.fecha}
                            className="tema-lcd flex w-11 shrink-0 flex-col items-center pt-0.5 sm:w-13"
                          >
                            <span className="font-pixel text-[22px] leading-none sm:text-[26px]">
                              {format.dateTime(new Date(entrada.fecha), { day: "2-digit" })}
                            </span>
                            <span className="mt-1.5 text-[11px] font-semibold text-secondary-purple uppercase">
                              {format.dateTime(new Date(entrada.fecha), { weekday: "short" }).replace(".", "")}
                            </span>
                          </time>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            {entrada.categoria ? (
                              <span className="flex items-center gap-1.5 text-xs font-medium">
                                <span
                                  aria-hidden="true"
                                  className="h-2 w-2 shrink-0 border-[1.5px] border-ink-strong"
                                  style={{ background: colorCategoria(categorias, entrada.categoria.id) }}
                                />
                                <span className="truncate">{entrada.categoria.nombre}</span>
                              </span>
                            ) : null}
                            <h3 className="font-diario text-lg leading-snug font-semibold sm:text-xl">
                              {entrada.titulo || t("sinTitulo")}
                            </h3>
                            {entrada.extracto ? (
                              <p className="line-clamp-2 font-diario text-[15px] leading-relaxed text-muted/80">
                                {entrada.extracto}
                              </p>
                            ) : null}
                          </div>
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
