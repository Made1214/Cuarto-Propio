import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Qué versión de la app es este build: queda escrita tanto en el código del
  // navegador como en el del servidor, y `/api/version` las compara para que
  // la PWA instalada se recargue sola tras un deploy (ver
  // src/components/actualizar-app.tsx). En Vercel, el commit; en local, la
  // hora del build.
  env: {
    VERSION_APP: process.env.VERCEL_GIT_COMMIT_SHA ?? `local-${Date.now()}`,
  },
  experimental: {
    staleTimes: {
      // Volver a una sección visitada hace menos de 30 s la muestra al
      // instante desde la caché del navegador en vez de pedirla de nuevo (por
      // defecto es 0: cada ida y vuelta Diario ↔ Listas esperaba al servidor).
      dynamic: 30,
      // Lo precargado (páginas estáticas y `loading.tsx`) vale un minuto, no
      // los 5 por defecto. La barra de secciones ya no precarga las páginas
      // enteras: así, las actions de cada sección la refrescan (ver
      // nav-secciones.tsx).
      static: 60,
    },
  },
  images: {
    // 90 para las ilustraciones de la landing (con 75 se veían blandas en
    // pantallas de 1.5x–2x); 75 para todo lo demás.
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        // Incluye `/sign/` y no solo `/public/`: los buckets de la app son
        // privados y todo se sirve con URLs firmadas.
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
