import { getTranslations } from "next-intl/server";
import { RecuperarForm } from "./recuperar-form";

export default async function RecuperarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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
