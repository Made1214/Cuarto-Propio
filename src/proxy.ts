import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

/** Secciones que solo existen con sesión (las del layout de `(app)`). */
const SECCIONES_PRIVADAS = ["/diario", "/listas", "/vitrina", "/audio", "/personalizacion"];

/** `/es/diario/abc` → `/diario/abc`; `null` si la ruta no trae idioma (de
 * esas se encarga next-intl, que redirige a la versión con idioma). */
function rutaSinIdioma(pathname: string): { locale: string; resto: string } | null {
  const [, locale, ...partes] = pathname.split("/");
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) return null;
  return { locale, resto: `/${partes.join("/")}` };
}

export default async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  // Mantiene la sesión de Supabase fresca en cada request (necesario porque
  // los Server Components no pueden escribir cookies por sí mismos).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // `getClaims()` y no `getUser()`: el proxy corre en CADA request —cada
  // navegación, cada prefetch de los links visibles, cada Server Action— y
  // `getUser()` era una ida al servidor de Auth (~120 ms) antes de empezar a
  // renderizar nada. `getClaims()` hace lo mismo que importa acá:
  // - Refresca la sesión: por dentro llama a `getSession()`, que si el access
  //   token venció (o está por vencer) lo renueva con el refresh token y
  //   escribe las cookies nuevas en la respuesta vía `setAll`.
  // - Verifica la firma del JWT localmente con la clave pública del proyecto
  //   (ES256), sin red; ver `obtenerUsuario` en `src/lib/supabase/server.ts`
  //   para el detalle de qué garantiza y qué no.
  // Nunca `getSession()` a secas: no verifica la firma.
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims.sub);

  // Redirección optimista al login para las secciones privadas, sin llegar a
  // renderizar: hace falta acá y no solo en el layout de `(app)` porque los
  // layouts no se vuelven a ejecutar al navegar entre secciones — con la
  // sesión vencida, ir de Diario a Listas renderizaría una pantalla vacía (RLS
  // no devuelve nada) en vez de mandar al login. El layout conserva su propio
  // chequeo como segunda línea de defensa.
  // Solo GET/HEAD: un POST a esas rutas es una Server Action, que valida la
  // sesión por su cuenta con `getUser()` y no sabría qué hacer con un 307.
  if (!conSesion && (request.method === "GET" || request.method === "HEAD")) {
    const ruta = rutaSinIdioma(request.nextUrl.pathname);
    const esPrivada = ruta
      ? SECCIONES_PRIVADAS.some((s) => ruta.resto === s || ruta.resto.startsWith(`${s}/`))
      : false;

    if (ruta && esPrivada && !response.headers.has("location")) {
      const destino = NextResponse.redirect(new URL(`/${ruta.locale}/login`, request.url));
      // Las cookies que haya escrito el intento de refresco (p. ej. borrar
      // una sesión inválida) viajan también con la redirección.
      response.cookies.getAll().forEach((cookie) => destino.cookies.set(cookie));
      return destino;
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
