import type { JSONContent } from "@tiptap/core";

/**
 * Imágenes incrustadas en el Diario.
 *
 * El contenido de una entrada guarda una URL estable de la app
 * (`/api/diario/imagen?ruta=…`) y no la URL firmada de Storage, que vence a
 * las pocas horas: si se guardara esa, las fotos de una entrada vieja
 * dejarían de verse. La ruta de la app firma en el momento y redirige.
 *
 * Este archivo no importa nada del servidor: lo usan el editor (cliente), la
 * vista de lectura y las Server Actions.
 */
export const RUTA_IMAGEN_DIARIO = "/api/diario/imagen";

export function urlImagenDiario(path: string): string {
  return `${RUTA_IMAGEN_DIARIO}?ruta=${encodeURIComponent(path)}`;
}

/** La ruta de Storage dentro de una URL de imagen del diario, o `null` si
 * la URL no es una de las nuestras (una imagen pegada desde otra web, por
 * ejemplo, que el editor no acepta). */
export function pathDesdeUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url.startsWith(`${RUTA_IMAGEN_DIARIO}?`)) return null;
  const ruta = new URLSearchParams(url.slice(RUTA_IMAGEN_DIARIO.length + 1)).get("ruta");
  return ruta || null;
}

export function esUrlImagenDiario(url: unknown): url is string {
  return pathDesdeUrl(url) !== null;
}

/** Todas las rutas de Storage (miniatura y completa) que menciona una
 * entrada. Sirve para borrar los archivos que una edición dejó de usar, o
 * todos al borrar la entrada. */
export function pathsImagenesEnContenido(contenido: JSONContent | null | undefined): string[] {
  const paths = new Set<string>();
  const recorrer = (nodo: JSONContent) => {
    if (nodo.type === "image") {
      for (const url of [nodo.attrs?.src, nodo.attrs?.completa]) {
        const path = pathDesdeUrl(url);
        if (path) paths.add(path);
      }
    }
    nodo.content?.forEach(recorrer);
  };
  if (contenido) recorrer(contenido);
  return [...paths];
}
