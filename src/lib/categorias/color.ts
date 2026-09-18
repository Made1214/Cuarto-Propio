import type { Categoria } from "./types";

/**
 * No hay color propio por categoría en el modelo de datos — se asigna por
 * POSICIÓN dentro de la lista de categorías del usuario (no por hash del
 * id). Un hash puro puede coincidir por pura estadística incluso con pocas
 * categorías (con 5 categorías y 12 colores, hay ~60% de probabilidad de
 * que dos caigan exactamente en el mismo color). Asignando por posición,
 * mientras haya `PALETA_CATEGORIA.length` categorías o menos, nunca se
 * repiten — a partir de ahí, sí, porque no hay más pasteles distinguibles
 * a simple vista para seguir sumando.
 *
 * Contrapartida: si se borra o agrega una categoría en el medio de la
 * lista, el color de las que quedan después puede correrse. Se acepta ese
 * costo a cambio de que, en el uso normal, nunca se repita un color.
 *
 * Compartido entre módulos (diario, listas, galería, audio): todos usan
 * las mismas categorías del usuario, así que el mismo nombre de categoría
 * siempre se ve del mismo color sin importar desde qué módulo se mire.
 */
const PALETA_CATEGORIA = [
  "#F5B8C4", // rosa
  "#F7C99B", // durazno
  "#F0E29A", // amarillo pastel
  "#B8E0B0", // verde
  "#9BD9C9", // turquesa
  "#A0D0EA", // celeste
  "#AEB8F0", // periwinkle
  "#CBAEEA", // lavanda
  "#E0A8D8", // orquídea
  "#F0A0A8", // coral
  "#E0C9A0", // arena
  "#A8E0D0", // aqua
] as const;

export function colorCategoria(categorias: Categoria[], id: string | null | undefined): string {
  if (!id) return PALETA_CATEGORIA[0];
  const indice = categorias.findIndex((cat) => cat.id === id);
  if (indice === -1) return PALETA_CATEGORIA[0];
  return PALETA_CATEGORIA[indice % PALETA_CATEGORIA.length];
}
