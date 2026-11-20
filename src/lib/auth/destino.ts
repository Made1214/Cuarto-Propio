import { routing } from "@/i18n/routing";

/**
 * El `?next=` del login, limpio: solo una ruta de este mismo sitio y sin el
 * idioma adelante (`/diario/abc?q=1`), porque `redirect` de next-intl ya le
 * pone el idioma de la sesión. Nada que pueda sacar del sitio (`//otro.com`,
 * `/\otro.com`, `https://…`) ni volver al login. `null` si no sirve.
 */
export function destinoSeguro(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length > 512) return null;
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return null;

  let ruta = valor;
  const [, primero] = ruta.split(/[/?#]/);
  if ((routing.locales as readonly string[]).includes(primero)) {
    ruta = ruta.slice(primero.length + 1) || "/";
  }
  if (!ruta.startsWith("/") || ruta.startsWith("//")) return null;
  if (/^\/(login|registro|recuperar|restablecer)(\/|\?|#|$)/.test(ruta)) return null;
  return ruta;
}
