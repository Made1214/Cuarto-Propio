import { setRequestLocale } from "next-intl/server";
import { Landing } from "@/components/landing/landing";

/**
 * La landing es estática (se prerenderiza una vez por idioma): quien ya tiene
 * sesión no llega hasta acá, el proxy la manda directo al diario
 * (src/proxy.ts).
 */
export default async function RootPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Landing locale={locale} />;
}
