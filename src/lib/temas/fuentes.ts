/**
 * Tipografías que se pueden elegir en Personalización. Set curado: cada una
 * está cargada con `next/font` en el layout raíz (variable CSS propia) y solo
 * se descarga si de verdad se usa.
 *
 * Diario = lo que la usuaria escribe; interfaz = navegación, botones,
 * etiquetas. Van por separado para que una letra decorativa nunca vuelva
 * ilegible un botón.
 */
export const FUENTES_DIARIO = {
  lora: { nombre: "Lora", variable: "--font-lora", respaldo: "Georgia, serif" },
  inter: { nombre: "Inter", variable: "--font-inter", respaldo: "system-ui, sans-serif" },
  caveat: { nombre: "Caveat", variable: "--font-caveat", respaldo: "cursive" },
  maquina: { nombre: "Special Elite", variable: "--font-special-elite", respaldo: "Courier New, monospace" },
  mono: { nombre: "IBM Plex Mono", variable: "--font-plex-mono", respaldo: "Courier New, monospace" },
} as const;

export const FUENTES_INTERFAZ = {
  inter: { nombre: "Inter", variable: "--font-inter", respaldo: "system-ui, sans-serif" },
  nunito: { nombre: "Nunito", variable: "--font-nunito", respaldo: "system-ui, sans-serif" },
  pixel: { nombre: "Silkscreen", variable: "--font-silkscreen", respaldo: "monospace" },
  mono: { nombre: "IBM Plex Mono", variable: "--font-plex-mono", respaldo: "Courier New, monospace" },
  pixelify: { nombre: "Pixelify Sans", variable: "--font-pixelify", respaldo: "monospace" },
} as const;

export type FuenteDiarioId = keyof typeof FUENTES_DIARIO;
export type FuenteInterfazId = keyof typeof FUENTES_INTERFAZ;

export function esFuenteDiario(valor: unknown): valor is FuenteDiarioId {
  return typeof valor === "string" && valor in FUENTES_DIARIO;
}

export function esFuenteInterfaz(valor: unknown): valor is FuenteInterfazId {
  return typeof valor === "string" && valor in FUENTES_INTERFAZ;
}
