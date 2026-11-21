import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EntradaContenido } from "@/components/entrada-contenido";
import { eliminarEntrada } from "@/lib/diario/actions";
import { listarCategorias } from "@/lib/categorias/queries";
import { obtenerEntradaPorCodigo } from "@/lib/diario/queries";
import { EliminarEntradaBoton } from "./eliminar-boton";
import { BarraEntrada } from "../barra-entrada";
import { MetaEntrada } from "../meta-entrada";

export default async function EntradaPage({
  params,
}: {
  params: Promise<{ locale: string; codigo: string }>;
}) {
  const { locale, codigo } = await params;

  const [t, categorias, entrada] = await Promise.all([
    getTranslations({ locale, namespace: "diario" }),
    listarCategorias(),
    obtenerEntradaPorCodigo(codigo),
  ]);

  if (!entrada) {
    notFound();
  }

  const eliminar = eliminarEntrada.bind(null, locale, entrada.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <article className="border-(length:--borde) border-ink rounded-theme bg-card shadow-marco">
        <BarraEntrada
          volverHref="/diario"
          volverTexto={t("volver")}
          acciones={
            <>
              <EliminarEntradaBoton action={eliminar} />
              <Link href={`/diario/${codigo}/editar`} className="boton boton-turquesa">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
                </svg>
                {t("editar")}
              </Link>
            </>
          }
        />
        {/* Misma caja, mismos márgenes y misma letra que al editar: pasar de
            leer a editar no reacomoda la página. */}
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <MetaEntrada fecha={entrada.fecha} categoriaId={entrada.categoriaId} categoriaNombre={entrada.categoriaNombre} categorias={categorias} locale={locale} />
          <h1 className="font-diario text-2xl leading-tight font-bold break-words text-secondary-purple sm:text-3xl">
            {entrada.titulo || t("sinTitulo")}
          </h1>
          <EntradaContenido contenido={entrada.contenido} />
        </div>
      </article>
    </div>
  );
}
