import type { Categoria } from "./types";

/**
 * Color de una categoría: una de las 12 variables `--cat-N` que define el
 * tema activo (ver `src/lib/temas/categorias.ts`), así el color sigue al
 * tema, al modo claro/oscuro y a los colores propios de la usuaria.
 *
 * Qué número le toca a cada categoría no depende del orden en que se
 * muestran (alfabético) ni de cuántas haya antes: se recorren por orden de
 * creación y cada una toma el lugar que le da un hash de su id; si ya está
 * ocupado, el siguiente libre. Consecuencias:
 *
 * - Mientras haya 12 categorías o menos, nunca se repite un color.
 * - Crear una categoría nueva no cambia el color de ninguna existente
 *   (es la última en el orden de creación, así que solo ocupa un lugar libre).
 * - Borrar una solo puede mover a las que chocaron con ella al asignarse,
 *   no a todas las que venían después.
 *
 * Compartido entre módulos: todos usan las mismas categorías del usuario,
 * así que una categoría se ve del mismo color desde cualquier sección.
 */

const CANTIDAD = 12;

/** Respaldo si la página no tiene las variables del tema (no debería pasar
 * dentro de la app; el layout siempre las inyecta). Pasteles del tema de
 * fábrica en el mismo orden de tonos. */
const RESPALDO = [
  "#F5B8C4",
  "#A0D0EA",
  "#F0E29A",
  "#CBAEEA",
  "#B8E0B0",
  "#F0A0A8",
  "#9BD9C9",
  "#E0A8D8",
  "#F7C99B",
  "#AEB8F0",
  "#A8E0D0",
  "#E0C9A0",
] as const;

/** FNV-1a de 32 bits: estable entre servidor y navegador, sin dependencias. */
function hash(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function porCreacion(a: Categoria, b: Categoria): number {
  // Sin fecha (una categoría recién escrita que todavía no volvió del
  // servidor) va al final: es la más nueva.
  const fa = a.creadoEn ?? "￿";
  const fb = b.creadoEn ?? "￿";
  if (fa !== fb) return fa < fb ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Lugar (0–11) que le toca a cada categoría de la lista. */
export function asignarIndices(categorias: Categoria[]): Map<string, number> {
  const indices = new Map<string, number>();
  const ocupados = new Set<number>();
  for (const cat of [...categorias].sort(porCreacion)) {
    let lugar = hash(cat.id) % CANTIDAD;
    if (ocupados.size < CANTIDAD) {
      while (ocupados.has(lugar)) lugar = (lugar + 1) % CANTIDAD;
    }
    ocupados.add(lugar);
    indices.set(cat.id, lugar);
  }
  return indices;
}

export function indiceCategoria(categorias: Categoria[], id: string | null | undefined): number {
  if (!id) return 0;
  return asignarIndices(categorias).get(id) ?? hash(id) % CANTIDAD;
}

export function colorCategoria(categorias: Categoria[], id: string | null | undefined): string {
  const i = indiceCategoria(categorias, id);
  return `var(--cat-${i}, ${RESPALDO[i]})`;
}
