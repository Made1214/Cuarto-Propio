export const TITULO_MAXIMO = 100;

/** Qué le pasa al título de una entrada (ya recortado), o `null` si está bien.
 * Es obligatorio y tiene tope de largo (CLAUDE.md → Diario). */
export function errorTitulo(titulo: string): "requerido" | "demasiadoLargo" | null {
  if (!titulo) return "requerido";
  if (titulo.length > TITULO_MAXIMO) return "demasiadoLargo";
  return null;
}
