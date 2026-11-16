import type { JSONContent } from "@tiptap/core";

/**
 * ¿La entrada no tiene nada adentro? (CLAUDE.md → Diario: con el campo de
 * texto vacío no se guarda y se pide contenido.)
 *
 * Vacía = sin texto que no sea solo espacios Y sin imágenes incrustadas: una
 * entrada que es solo una foto sí dice algo. Lo demás que Tiptap deja en un
 * documento en blanco (párrafos vacíos, saltos de línea, una línea
 * horizontal suelta) no cuenta como contenido.
 *
 * No importa nada del servidor ni del editor: lo usan el formulario, para
 * avisar sin hacer el viaje, y la Server Action, que es la que no se puede
 * saltear.
 */
export function contenidoVacio(contenido: JSONContent | null | undefined): boolean {
  if (!contenido) return true;
  const hayAlgo = (nodo: JSONContent): boolean => {
    if (nodo.type === "image") return true;
    if (typeof nodo.text === "string" && nodo.text.trim() !== "") return true;
    return nodo.content?.some(hayAlgo) ?? false;
  };
  return !hayAlgo(contenido);
}
