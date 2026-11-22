/** Hashtags de la Vitrina: letras (con sus tildes y la ñ), números y guion
 * bajo, siempre en minúsculas — `#Viajes` y `#viajes` son el mismo hashtag
 * (CLAUDE.md). Las tildes se conservan: en español son parte de la palabra
 * (`#diseño` no es `#diseno`). Que la misma palabra escrita sin tilde desde
 * otro teclado no quede como una etiqueta aparte lo resuelve
 * `unificarHashtags` al guardar. */
export function normalizarHashtags(crudo: string): string[] {
  const plano = crudo.normalize("NFC").toLocaleLowerCase();
  const encontrados = plano.match(/[\p{L}\p{M}\p{N}_]+/gu) ?? [];
  return [...new Set(encontrados.map((hashtag) => hashtag.normalize("NFC")))];
}

/** La forma de comparar dos hashtags sin mirar tildes: `café` y `cafe`
 * pliegan igual. Solo para comparar; nunca es lo que se guarda. */
export function plegarHashtag(hashtag: string): string {
  return hashtag.normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * Une los hashtags nuevos con los que la cuenta ya usa: si uno nuevo es una
 * etiqueta existente escrita con otras tildes (`#cafe` cuando ya hay
 * `#café`, o al revés), se guarda con la forma que ya estaba, así el filtro
 * sigue siendo uno solo. Dentro de lo nuevo, también se queda la primera.
 */
export function unificarHashtags(nuevos: string[], existentes: Iterable<string>): string[] {
  const conocidos = new Map<string, string>();
  for (const hashtag of existentes) {
    const clave = plegarHashtag(hashtag);
    if (!conocidos.has(clave)) conocidos.set(clave, hashtag);
  }
  const resultado: string[] = [];
  for (const hashtag of nuevos) {
    const clave = plegarHashtag(hashtag);
    const forma = conocidos.get(clave) ?? hashtag;
    conocidos.set(clave, forma);
    if (!resultado.includes(forma)) resultado.push(forma);
  }
  return resultado;
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
