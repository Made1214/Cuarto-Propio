import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

/**
 * Adonde llegan los enlaces de los correos de Supabase (confirmar cuenta,
 * recuperar contraseña). Canjea el código del enlace por una sesión y manda a
 * `next`: el diario tras confirmar la cuenta, o la pantalla de contraseña
 * nueva tras pedir recuperarla.
 *
 * Acepta las dos formas de enlace de Supabase: `?code=` (el flujo PKCE, el
 * que usa la plantilla de correo por defecto) y `?token_hash=&type=` (por si
 * se personalizan las plantillas).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;

  // Solo rutas de este mismo sitio: nada de `//otro-sitio.com`.
  const pedido = url.searchParams.get("next") ?? "";
  const siguiente = pedido.startsWith("/") && !pedido.startsWith("//") ? pedido : `/${routing.defaultLocale}/diario`;

  const supabase = await createClient();
  let abierta = false;
  if (code) {
    abierta = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && tipo) {
    abierta = !(await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash })).error;
  }

  if (abierta) return NextResponse.redirect(new URL(siguiente, url.origin));

  const segmento = siguiente.split("/")[1];
  const locale = (routing.locales as readonly string[]).includes(segmento) ? segmento : routing.defaultLocale;
  return NextResponse.redirect(new URL(`/${locale}/login?error=enlace`, url.origin));
}
