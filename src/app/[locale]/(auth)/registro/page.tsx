import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PestanasAcceso } from "../componentes";
import { RegistroForm } from "./registro-form";
import { esPreset, TEMAS_DISPONIBLES } from "@/lib/temas/presets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: `${t("metaCrear")} · Cuarto Propio` };
}

export default async function RegistroPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tema?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tema: pedido } = await searchParams;
  // El tema que se probó en la landing (`?tema=void`): se guarda con la
  // cuenta y es con el que abre el cuarto la primera vez.
  const tema = esPreset(pedido) ? pedido : null;
  const t = await getTranslations({ locale, namespace: "login" });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-diario text-3xl font-bold text-secondary-purple">
        {t("saludoCrear")}
      </h1>
      <PestanasAcceso activa="crear" />
      {tema ? (
        <p className="flex items-center gap-2 border-(length:--borde) border-ink rounded-theme bg-card px-3 py-2.5 text-sm">
          <span aria-hidden="true">✦</span>
          {t("temaElegido", { tema: TEMAS_DISPONIBLES[tema].nombre })}
        </p>
      ) : null}
      <RegistroForm locale={locale} tema={tema} />
    </div>
  );
}
