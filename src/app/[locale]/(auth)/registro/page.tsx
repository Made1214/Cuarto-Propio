import { getTranslations } from "next-intl/server";
import { PestanasAcceso } from "../componentes";
import { RegistroForm } from "./registro-form";

export default async function RegistroPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-diario text-3xl font-bold text-secondary-purple">{t("saludoCrear")}</h1>
      <PestanasAcceso activa="crear" />
      <RegistroForm locale={locale} />
    </div>
  );
}
