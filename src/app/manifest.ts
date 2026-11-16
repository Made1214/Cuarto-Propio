import type { MetadataRoute } from "next";

/**
 * Manifest de la PWA: lo que hace que Cuarto Propio se pueda instalar en el
 * celular (ícono propio, pantalla completa sin barra del navegador).
 *
 * Fase 1 NO incluye modo offline (CLAUDE.md → Stack): a propósito no hay
 * service worker ni caché de contenido. Chrome y Safari ya permiten
 * instalar con solo este manifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cuarto Propio",
    short_name: "Cuarto Propio",
    description: "Diario, listas, vitrina y audio — tu espacio personal.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FCF6F3",
    theme_color: "#5B3F73",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
