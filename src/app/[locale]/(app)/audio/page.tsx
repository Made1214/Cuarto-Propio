import { getTranslations } from "next-intl/server";
import { CargarMas, FinDeLista } from "@/components/cargar-mas";
import { FiltroCategoria } from "@/components/filtro-categoria";
import { Link } from "@/i18n/navigation";
import { listarAudios } from "@/lib/audio/queries";
import { listarConFiltroCategoria } from "@/lib/categorias/filtro";
import { Grabador } from "./grabador";
import { IconoAudio } from "./iconos";
import { NotaAudio } from "./nota-audio";

export default async function AudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categoria?: string; hasta?: string }>;
}) {
  const { locale } = await params;
  const { categoria: categoriaUrl, hasta } = await searchParams;
  const t = await getTranslations({ locale, namespace: "audio" });

  const {
    categorias,
    categoriaActual,
    resultado: pagina,
  } = await listarConFiltroCategoria(categoriaUrl, (categoriaId) =>
    // El total solo se cuenta si se va a mostrar, o sea, al filtrar.
    listarAudios({ categoriaId, hasta, contar: Boolean(categoriaId) }),
  );

  // Solo la categoría que de verdad existe: un id roto en la URL se trata
  // como si no hubiera filtro (ver `listarConFiltroCategoria`).
  const categoria = categoriaActual?.id;
  const notas = pagina.filas;
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
      </div>

      {/* Una sola grabadora, siempre arriba y a la vista: grabar es lo
          principal de esta pantalla, también con el archivo vacío. */}
      <Grabador />

      <FiltroCategoria pathname="/audio" categorias={categorias} categoriaActualId={categoria ?? null} />

      {categoria ? (
        <p className="-mt-2 text-sm text-muted/80">
          <span className="font-semibold tabular-nums">
            {t("resultados", { cantidad: pagina.total ?? notas.length })}
          </span>
          {" · "}
          <Link href="/audio" className="font-semibold text-secondary-purple underline-offset-2 hover:underline">
            {t("limpiarFiltros")}
          </Link>
        </p>
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
              className="flex h-11 items-center border-2 border-ink bg-card px-4 text-sm font-semibold text-ink transition-colors hover:bg-secondary-purple/10"
            >
              {t("limpiarFiltros")}
            </Link>
          ) : null}
        </div>
      ) : (
        /* Una nota por fila y no en columnas como Listas o Vitrina: acá lo
           que manda es el orden cronológico (lo último grabado primero) y el
           reproductor necesita el ancho completo para no quedar apretado. */
        <div className="flex flex-col gap-5">
          {notas.map((nota) => (
            <NotaAudio key={nota.id} nota={nota} categorias={categorias} />
          ))}

          {/* El filtro viaja con el "cargar más"; los links de filtro no
              llevan `hasta`, así que cambiar de categoría vuelve a la
              primera tanda. */}
          {pagina.siguiente ? (
            <CargarMas
              pathname="/audio"
              query={{ ...(categoria ? { categoria } : {}), hasta: pagina.siguiente }}
            />
          ) : pagina.conCursor ? (
            <FinDeLista />
          ) : null}
        </div>
      )}
    </div>
  );
}
