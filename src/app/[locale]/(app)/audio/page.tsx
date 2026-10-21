import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listarAudios } from "@/lib/audio/queries";
import { colorCategoria } from "@/lib/categorias/color";
import { listarCategorias } from "@/lib/categorias/queries";
import { Grabador } from "./grabador";
import { IconoAudio } from "./iconos";
import { NotaAudio } from "./nota-audio";

export default async function AudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { locale } = await params;
  const { categoria } = await searchParams;
  const t = await getTranslations({ locale, namespace: "audio" });

  const [categorias, notas] = await Promise.all([
    listarCategorias(),
    listarAudios({ categoriaId: categoria }),
  ]);

  const categoriaActual = categorias.find((cat) => cat.id === categoria) ?? null;
  // Con el archivo vacío, la invitación del centro ya es el botón de grabar:
  // repetirlo arriba no solo se ve redundante, son dos grabadoras con estado
  // propio (empezar en una no apagaría la otra). Se muestra una sola.
  const vacioSinFiltro = notas.length === 0 && !categoria;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="mt-1 shrink-0 text-secondary-turquoise">
            <IconoAudio />
          </span>
          <div>
            <h1 className="font-diario text-4xl font-bold text-secondary-purple">{t("titulo")}</h1>
            <p className="mt-1 text-sm text-muted/70">{t("subtitulo")}</p>
          </div>
        </div>

        {vacioSinFiltro ? null : <Grabador />}
      </div>

      {categorias.length > 0 ? (
        <details className="group relative w-64">
          <summary className="marker:content-none flex cursor-pointer list-none items-center justify-between gap-2 border-2 border-ink bg-card px-4 py-2.5 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10 [&::-webkit-details-marker]:hidden">
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
              href="/audio"
              className="flex items-center gap-2 px-3 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
            >
              {t("todasLasCategorias").toUpperCase()}
            </Link>
            {categorias.map((cat) => (
              <Link
                key={cat.id}
                href={{ pathname: "/audio", query: { categoria: cat.id } }}
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

      {categoria ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-pixel text-xs text-muted/70 tabular-nums">
            {t("resultados", { cantidad: notas.length })}
          </span>
          <Link
            href="/audio"
            className="border-2 border-ink bg-card px-2.5 py-1 font-pixel text-[10px] tracking-wide text-ink transition-colors hover:bg-primary-pink/30"
          >
            {t("limpiarFiltros").toUpperCase()}
          </Link>
        </div>
      ) : null}

      {notas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-ink/40 bg-card/30 px-6 py-12 text-center">
          <span className="text-secondary-purple">
            <IconoAudio />
          </span>
          <p className="text-muted/70">{categoria ? t("sinResultados") : t("vacio")}</p>
          {categoria ? (
            <Link
              href="/audio"
              className="border-2 border-ink bg-card px-4 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
            >
              {t("limpiarFiltros").toUpperCase()}
            </Link>
          ) : (
            <Grabador variante="panel" />
          )}
        </div>
      ) : (
        /* Una nota por fila y no en columnas como Listas o Vitrina: acá lo
           que manda es el orden cronológico (lo último grabado primero) y el
           reproductor necesita el ancho completo para no quedar apretado. */
        <div className="flex flex-col gap-5">
          {notas.map((nota) => (
            <NotaAudio key={nota.id} nota={nota} categorias={categorias} />
          ))}
        </div>
      )}
    </div>
  );
}
