/**
 * Set curado de cursores (archivos en `public/cursores/`, generados con
 * `node scripts/generar-cursores.mjs public/cursores`). `punto` es el
 * "hotspot": el píxel exacto que hace clic.
 */
export const CURSORES = {
  flecha: { archivo: "/cursores/flecha.png", punto: [2, 2] },
  corazon: { archivo: "/cursores/corazon.png", punto: [14, 12] },
  estrella: { archivo: "/cursores/estrella.png", punto: [14, 12] },
  lapiz: { archivo: "/cursores/lapiz.png", punto: [1, 29] },
} as const;

export type CursorId = keyof typeof CURSORES;

export function esCursor(valor: unknown): valor is CursorId {
  return typeof valor === "string" && valor in CURSORES;
}

/** Punto de clic de un cursor subido: arriba a la izquierda, como una flecha. */
export const PUNTO_CURSOR_PROPIO = [2, 2] as const;
