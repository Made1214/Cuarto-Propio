import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DocumentoLegal } from "../documento-legal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: `${t("terminos.titulo")} · Cuarto Propio` };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <DocumentoLegal locale={locale} documento="terminos" />;
}
