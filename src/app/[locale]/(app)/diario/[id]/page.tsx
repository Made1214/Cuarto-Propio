import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { actualizarEntrada, eliminarEntrada } from "@/lib/diario/actions";
import { listarCategorias, obtenerEntrada } from "@/lib/diario/queries";
import { EntradaForm } from "../entrada-form";
import { EliminarEntradaBoton } from "./eliminar-boton";

export default async function EntradaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const [t, categorias, entrada] = await Promise.all([
    getTranslations({ locale, namespace: "diario" }),
    listarCategorias(),
    obtenerEntrada(id),
  ]);

  if (!entrada) {
    notFound();
  }

  const actualizar = actualizarEntrada.bind(null, locale, id);
  const eliminar = eliminarEntrada.bind(null, locale, id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("editarEntrada")}</h1>
        <Link
          href="/diario"
          className="text-sm text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          {t("volver")}
        </Link>
      </div>
      <EntradaForm
        action={actualizar}
        categorias={categorias}
        valoresIniciales={{
          titulo: entrada.titulo,
          categoriaNombre: entrada.categoriaNombre,
          contenido: entrada.contenido,
        }}
      />
      <EliminarEntradaBoton action={eliminar} />
    </div>
  );
}
