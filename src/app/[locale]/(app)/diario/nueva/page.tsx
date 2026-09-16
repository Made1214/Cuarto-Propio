import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { crearEntrada } from "@/lib/diario/actions";
import { listarCategorias } from "@/lib/diario/queries";
import { EntradaForm } from "../entrada-form";

export default async function NuevaEntradaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "diario" });
  const categorias = await listarCategorias();
  const crear = crearEntrada.bind(null, locale);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("nuevaEntrada")}</h1>
        <Link
          href="/diario"
          className="text-sm text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          {t("volver")}
        </Link>
      </div>
      <EntradaForm action={crear} categorias={categorias} />
    </div>
  );
}
