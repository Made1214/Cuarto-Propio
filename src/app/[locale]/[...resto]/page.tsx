import { notFound } from "next/navigation";

/**
 * Cualquier ruta que no existe dentro de un idioma (`/es/lo-que-sea`) cae
 * acá y muestra la 404 propia de `[locale]/not-found.tsx`, con la marca y en
 * el idioma de la URL, en vez de la genérica de Next.
 */
export default function RutaDesconocida() {
  notFound();
}
