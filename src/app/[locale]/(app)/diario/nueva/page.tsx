import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { crearEntrada } from "@/lib/diario/actions";
import { listarCategorias } from "@/lib/categorias/queries";
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

  const formId = "entrada-form";

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
          <h1 className="font-diario text-xl font-bold text-secondary-purple">{t("queEstasPensando")}</h1>
          <button
            type="submit"
            form={formId}
            className="border-2 border-ink bg-secondary-purple px-4 py-2 font-pixel text-xs tracking-wide text-background shadow-[3px_3px_0_var(--ink)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {t("guardar").toUpperCase()}
          </button>
        </div>

        <div className="p-5">
          <EntradaForm formId={formId} action={crear} categorias={categorias} />
        </div>
      </div>
    </div>
  );
}
