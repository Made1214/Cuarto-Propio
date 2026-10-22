import { obtenerUsuario } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";

export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Verificación local del JWT (sin ida al servidor de Auth): solo decide a
  // qué pantalla mandar, y cada una vuelve a mirar la sesión por su cuenta.
  const usuario = await obtenerUsuario();

  redirect({ href: usuario ? "/diario" : "/login", locale });
}
