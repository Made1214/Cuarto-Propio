import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Envuelto en `cache()` de React: durante el render de una página, layout,
 * página y cada consulta de `src/lib/*` comparten un mismo cliente en vez de
 * armar uno por llamada (cada uno vuelve a leer y parsear las cookies). El
 * caché vive solo lo que dura el render de ESE request, así que nunca se
 * comparte un cliente —ni su sesión— entre dos usuarias. Fuera del render
 * (Server Actions, Route Handlers) `cache()` no memoriza y cada llamada sigue
 * creando su propio cliente, como antes.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se llama desde un Server Component: el proxy refresca la sesión.
          }
        },
      },
    },
  );
});

/** Lo único que la app necesita saber de quien está adentro para pintar. */
export type UsuarioSesion = { id: string; email: string | null };

/**
 * Quién está adentro, verificado, o `null` si nadie. Una sola vez por render:
 * el layout y cualquier página que lo pida comparten el resultado.
 *
 * Seguridad — por qué `getClaims()` y no `getUser()` ni `getSession()`:
 * - `getSession()` solo lee la cookie, sin verificar nada: cualquiera puede
 *   escribirse una cookie con el `sub` de otra persona. Nunca sirve para
 *   decidir quién es la usuaria en el servidor.
 * - `getClaims()` verifica la FIRMA del JWT de la cookie. El proyecto firma
 *   con una clave asimétrica (ES256, publicada en
 *   `/auth/v1/.well-known/jwks.json`), así que la verificación es local con
 *   la clave pública, que supabase-js guarda en memoria del proceso 10
 *   minutos: cero idas a la red en el caso normal. Si algún día el proyecto
 *   volviera a una clave simétrica (HS256), `getClaims()` cae solo a
 *   `getUser()` —una ida al servidor de Auth—, así que nunca es menos seguro.
 * - Lo que se pierde frente a `getUser()`: un token firmado sigue valiendo
 *   hasta que vence (1 hora por defecto) aunque la sesión se haya cerrado en
 *   otro dispositivo. Es aceptable acá porque esto solo decide QUÉ PINTAR y a
 *   dónde redirigir: los datos los protege RLS en cada consulta (PostgREST
 *   vuelve a verificar el JWT) y las Server Actions y Route Handlers que
 *   escriben siguen usando `getUser()`, que sí consulta al servidor de Auth.
 */
export const obtenerUsuario = cache(async (): Promise<UsuarioSesion | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
});
