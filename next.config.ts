import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      // Volver a una sección visitada hace menos de 30 s la muestra al
      // instante desde la caché del navegador en vez de pedirla de nuevo (por
      // defecto es 0: cada ida y vuelta Diario ↔ Listas esperaba al servidor).
      dynamic: 30,
      // Lo precargado por la barra de menú (`prefetch` en nav-secciones.tsx)
      // vale un minuto, no los 5 por defecto: lo que se cambia en una sección
      // (una categoría nueva, por ejemplo) aparece pronto en las demás. Lo que
      // se cambia DENTRO de una sección no espera: las actions la refrescan.
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
