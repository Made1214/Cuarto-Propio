import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import { listarCategorias } from "@/lib/categorias/queries";
import { listarEntradas } from "@/lib/diario/queries";

export default async function DiarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { locale } = await params;
  const { q, categoria } = await searchParams;
  const t = await getTranslations({ locale, namespace: "diario" });
  const format = await getFormatter({ locale });

  const [categorias, entradas] = await Promise.all([
    listarCategorias(),
    listarEntradas({ categoriaId: categoria, busqueda: q }),
  ]);

  const hayFiltro = Boolean(q?.trim() || categoria);
  const categoriaActual = categorias.find((cat) => cat.id === categoria) ?? null;

  return (
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
        <form method="get" className="flex items-center gap-3">
          <div className="relative">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted/70">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-3.5-3.5" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder={t("buscarPlaceholder")}
              className="w-65 rounded-theme border-2 border-ink bg-card py-2.5 pr-3 pl-9 text-sm leading-none outline-none"
            />
          </div>
          <input type="hidden" name="categoria" value={categoria ?? ""} />
          <button
            type="submit"
            className="border-2 border-ink bg-card px-4 py-2.5 font-pixel text-xs leading-none tracking-wide text-ink transition-transform hover:bg-secondary-turquoise/15 active:translate-x-0.5 active:translate-y-0.5"
          >
            {t("buscar").toUpperCase()}
          </button>
        </form>

        <span className="h-6 w-0.75 bg-ink" aria-hidden="true" />

        {/* Desplegable en vez de chips: con muchas categorías, los chips se
            desbordan y no caben bien en una fila — el desplegable siempre
            se ve prolijo, sin importar cuántas categorías haya. */}
        <details className="group relative">
          <summary className="marker:content-none flex w-72 cursor-pointer list-none items-center justify-between gap-2 border-2 border-ink bg-card px-4 py-2.5 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10 [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 items-center gap-2">
              {categoriaActual ? (
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 border-2 border-ink-strong"
                  style={{ background: colorCategoria(categorias, categoriaActual.id) }}
                />
              ) : (
                <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
                  <rect x="0" y="0" width="4" height="4" fill="var(--secondary-purple)" />
                  <rect x="6" y="0" width="4" height="4" fill="var(--secondary-purple)" />
                  <rect x="0" y="6" width="4" height="4" fill="var(--secondary-purple)" />
                  <rect x="6" y="6" width="4" height="4" fill="var(--secondary-purple)" />
                </svg>
              )}
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
          <div className="absolute z-20 mt-2 flex w-72 flex-col border-2 border-ink bg-card p-1 shadow-[4px_4px_0_var(--ink)]">
            <Link
              href={{ pathname: "/diario", query: q ? { q } : {} }}
              className="flex items-center gap-2 px-3 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
            >
              <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
                <rect x="0" y="0" width="4" height="4" fill="var(--secondary-purple)" />
                <rect x="6" y="0" width="4" height="4" fill="var(--secondary-purple)" />
                <rect x="0" y="6" width="4" height="4" fill="var(--secondary-purple)" />
                <rect x="6" y="6" width="4" height="4" fill="var(--secondary-purple)" />
              </svg>
              {t("todasLasCategorias").toUpperCase()}
            </Link>
            {categorias.map((cat) => (
              <Link
                key={cat.id}
                href={{ pathname: "/diario", query: q ? { categoria: cat.id, q } : { categoria: cat.id } }}
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
      </div>

      {entradas.length === 0 ? (
        <p className="text-muted/70">{hayFiltro ? t("sinResultados") : t("vacio")}</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {entradas.map((entrada) => (
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
                    {format.dateTime(new Date(entrada.fecha), { dateStyle: "long" }).toUpperCase()}
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
                <h2 className="mt-2 font-diario text-xl font-semibold">
                  {entrada.titulo || t("sinTitulo")}
                </h2>
                {entrada.extracto ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted/70">{entrada.extracto}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
