import { getTranslations } from "next-intl/server";

export default async function GaleriaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "galeria" });

  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{t("titulo")}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("vacio")}</p>
    </div>
  );
}
