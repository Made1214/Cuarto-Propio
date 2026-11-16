/** Hashtags de la Vitrina: solo letras, números y guion bajo, siempre en
 * minúsculas — `#Viajes` y `#viajes` son el mismo hashtag (CLAUDE.md). Los
 * acentos se pliegan a su letra base para que `#diseño` y `#diseno` no
 * queden como dos etiquetas distintas al escribirlas desde teclados
 * diferentes. */
export function normalizarHashtags(crudo: string): string[] {
  const plano = crudo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const encontrados = plano.match(/[a-z0-9_]+/g) ?? [];
  return [...new Set(encontrados)];
}

/** Lo inverso, para rellenar el campo de texto al editar. */
export function formatearHashtags(hashtags: string[]): string {
  return hashtags.map((hashtag) => `#${hashtag}`).join(" ");
}

/**
 * El texto alternativo de una pieza. El título manda, salvo cuando es solo
 * el nombre de archivo que traía la foto (`6`, `IMG_2041`, `2024-03-01`): eso
 * no le dice nada a un lector de pantalla, así que se prefiere la
 * descripción, y si tampoco hay, el texto de respaldo.
 */
export function textoAlternativo(
  titulo: string | null | undefined,
  descripcion: string | null | undefined,
  respaldo: string,
): string {
  const t = titulo?.trim() ?? "";
  const d = descripcion?.trim() ?? "";
  if (t && !esNombreDeArchivo(t)) return t;
  if (d) return t && !esNombreDeArchivo(t) ? `${t}: ${d}` : d.slice(0, 160);
  return respaldo;
}

/** Sin una sola palabra de dos letras o más: números, fechas o códigos de
 * cámara tipo `IMG_2041` / `DSC0042`. */
export function esNombreDeArchivo(texto: string): boolean {
  const limpio = texto.replace(/^(img|dsc|pxl|dcim|photo|foto|screenshot|captura)[_\- ]?/i, "");
  return !/\p{L}{2,}/u.test(limpio);
}
