import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RecuperarForm } from "./recuperar-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: `${t("metaRecuperar")} · Cuarto Propio` };
}

export default async function RecuperarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "login" });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-diario text-3xl font-bold text-secondary-purple">
        {t("recuperarTitulo")}
      </h1>
      <p className="text-[15px] leading-snug text-muted/85">
        {t("recuperarAyuda")}
      </p>
      <RecuperarForm locale={locale} />
    </div>
  );
}
