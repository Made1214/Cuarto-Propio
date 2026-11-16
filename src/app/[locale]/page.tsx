import { Landing } from "@/components/landing/landing";
import { obtenerUsuario } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";

export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Verificación local del JWT (sin ida al servidor de Auth): solo decide a
  // dónde ir, y cada pantalla vuelve a mirar la sesión por su cuenta. Con
  // sesión se va directo al diario; sin ella, se ve la landing.
  const usuario = await obtenerUsuario();

  if (usuario) redirect({ href: "/diario", locale });

  return <Landing locale={locale} />;
}
