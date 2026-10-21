import type { JSONContent } from "@tiptap/core";

/** Borrador local de una entrada a medio escribir. Vive en el navegador,
 * nunca viaja al servidor: es solo la red de seguridad para que cerrar la
 * pestaña sin guardar no se lleve lo escrito. */
export type Borrador = {
  titulo: string;
  categoria: string;
  contenido: JSONContent | null;
  guardadoEn: number;
};

function clave(id: string) {
  return `cuarto-propio:borrador:${id}`;
}

export function leerBorrador(id: string): Borrador | null {
  try {
    const crudo = window.localStorage.getItem(clave(id));
    if (!crudo) return null;
    const borrador = JSON.parse(crudo) as Borrador;
    return typeof borrador?.guardadoEn === "number" ? borrador : null;
  } catch {
    // Modo privado, almacenamiento bloqueado o JSON corrupto: sin borrador.
    return null;
  }
}

export function guardarBorrador(id: string, borrador: Omit<Borrador, "guardadoEn">) {
  try {
    window.localStorage.setItem(clave(id), JSON.stringify({ ...borrador, guardadoEn: Date.now() }));
  } catch {
    // Si no hay espacio o el navegador lo bloquea, seguimos sin borrador.
  }
}

export function borrarBorrador(id: string) {
  try {
    window.localStorage.removeItem(clave(id));
  } catch {
    // Nada que hacer: el borrador simplemente no se limpia.
  }
}
