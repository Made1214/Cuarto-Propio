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
