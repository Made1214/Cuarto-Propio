import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EntradaContenido } from "@/components/entrada-contenido";
import { colorCategoria } from "@/lib/categorias/color";
import { eliminarEntrada } from "@/lib/diario/actions";
import { listarCategorias } from "@/lib/categorias/queries";
import { obtenerEntradaPorCodigo } from "@/lib/diario/queries";
import { EliminarEntradaBoton } from "./eliminar-boton";

export default async function EntradaPage({
  params,
}: {
  params: Promise<{ locale: string; codigo: string }>;
}) {
  const { locale, codigo } = await params;

  const [t, format, categorias, entrada] = await Promise.all([
    getTranslations({ locale, namespace: "diario" }),
    getFormatter({ locale }),
    listarCategorias(),
    obtenerEntradaPorCodigo(codigo),
  ]);

  if (!entrada) {
    notFound();
  }

  const eliminar = eliminarEntrada.bind(null, locale, entrada.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link
        href="/diario"
        className="flex w-fit items-center gap-2 font-pixel text-xs tracking-wide text-muted/70 transition-colors hover:text-secondary-purple"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t("volver").toUpperCase()}
      </Link>

      <div className="divide-y-2 divide-ink border-2 border-ink bg-card shadow-[5px_5px_0_var(--ink)]">
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-xs tracking-wide text-muted/70">
              {format.dateTime(new Date(entrada.fecha), { dateStyle: "long" }).toUpperCase()}
            </span>
            {entrada.categoriaNombre && entrada.categoriaId ? (
              <span
                className="border-2 border-ink-strong px-2.5 py-1 font-pixel text-xs tracking-wide text-ink-strong"
                style={{ background: colorCategoria(categorias, entrada.categoriaId) }}
              >
                {entrada.categoriaNombre.toUpperCase()}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href={`/diario/${codigo}/editar`}
              className="border-2 border-ink bg-secondary-turquoise px-4 py-2 font-pixel text-xs tracking-wide text-ink-strong transition-[filter] hover:brightness-95"
            >
              {t("editar").toUpperCase()}
            </Link>
            <EliminarEntradaBoton action={eliminar} />
          </div>
        </div>

        <div className="flex flex-col gap-3 p-6">
          <h1 className="font-diario text-3xl font-bold text-secondary-purple">
            {entrada.titulo || t("sinTitulo")}
          </h1>
          <EntradaContenido contenido={entrada.contenido} />
        </div>
      </div>
    </div>
  );
}
