import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AvisoAcceso, PestanasAcceso } from "../componentes";
import { LoginForm } from "./login-form";
import { destinoSeguro } from "@/lib/auth/destino";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: `${t("metaEntrar")} · Cuarto Propio` };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { error, next } = await searchParams;
  const t = await getTranslations({ locale, namespace: "login" });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-diario text-3xl font-bold text-secondary-purple">
        {t("saludoEntrar")}
      </h1>
      <PestanasAcceso activa="entrar" />
      {/* Volvió de un enlace de correo vencido o ya usado. */}
      {error === "enlace" ? (
        <AvisoAcceso tipo="error">{t("enlaceVencido")}</AvisoAcceso>
      ) : null}
      <LoginForm locale={locale} siguiente={destinoSeguro(next)} />
    </div>
  );
}
