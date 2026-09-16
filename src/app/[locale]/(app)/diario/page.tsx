import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listarCategorias, listarEntradas } from "@/lib/diario/queries";

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

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("titulo")}</h1>
        <Link
          href="/diario/nueva"
          className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          {t("nuevaEntrada")}
        </Link>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("buscarPlaceholder")}
          className="min-w-[200px] flex-1 rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
        />
        <select
          name="categoria"
          defaultValue={categoria ?? ""}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
        >
          <option value="">{t("todasLasCategorias")}</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-black/10 px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          {t("buscar")}
        </button>
      </form>

      {entradas.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          {hayFiltro ? t("sinResultados") : t("vacio")}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {entradas.map((entrada) => (
            <li key={entrada.id}>
              <Link
                href={`/diario/${entrada.id}`}
                className="block rounded-xl border border-black/10 p-5 transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
              >
                <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <time dateTime={entrada.fecha}>
                    {format.dateTime(new Date(entrada.fecha), { dateStyle: "long" })}
                  </time>
                  {entrada.categoria ? (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">
                      {entrada.categoria.nombre}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-1 text-lg font-medium">
                  {entrada.titulo || t("tituloPlaceholder")}
                </h2>
                {entrada.extracto ? (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {entrada.extracto}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
