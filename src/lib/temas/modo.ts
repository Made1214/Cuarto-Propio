import type { ModoColor } from "./types";

/**
 * Modo claro / oscuro / automático.
 *
 * "Automático" es la ausencia de elección: no se escribe `data-modo` en el
 * `<html>` y manda la media query `prefers-color-scheme` de globals.css. Así
 * el modo del sistema se sigue en vivo (si cambia a la noche, la app cambia
 * con él) sin que la app tenga que escuchar nada.
 *
 * La preferencia vive en `localStorage` y no en la base: es de este
 * dispositivo, no de la cuenta — el mismo diario puede querer verse oscuro
 * en el celular de noche y claro en la compu de día. Los temas de diseño
 * (Whimsical, Retro…) sí van a vivir en la base, y son otra cosa: ver
 * `presets.ts`.
 */
export type ModoPreferido = ModoColor | "auto";

export const MODOS: readonly ModoPreferido[] = ["claro", "oscuro", "auto"] as const;

export const CLAVE_MODO = "cuarto-propio:modo";

export const MODO_POR_DEFECTO: ModoPreferido = "auto";

/**
 * Corre en el `<head>`, antes del primer pintado: sin esto la página
 * aparecería clara un instante antes de que React hidrate y la pusiera
 * oscura. Va como texto plano (no como módulo) porque tiene que ejecutarse
 * sincrónico, y envuelto en try/catch porque `localStorage` explota en
 * navegación privada.
 */
export const SCRIPT_MODO = `try{var m=localStorage.getItem(${JSON.stringify(CLAVE_MODO)});if(m==="claro"||m==="oscuro"){document.documentElement.dataset.modo=m}}catch(e){}`;

export function leerModo(): ModoPreferido {
  try {
    const guardado = localStorage.getItem(CLAVE_MODO);
    if (guardado === "claro" || guardado === "oscuro") return guardado;
  } catch {
    // Navegación privada o storage bloqueado: se usa el automático.
  }
  return MODO_POR_DEFECTO;
}

/** Solo el DOM: pinta el modo que ya está decidido. */
export function pintarModo(modo: ModoPreferido): void {
  const html = document.documentElement;
  if (modo === "auto") {
    delete html.dataset.modo;
  } else {
    html.dataset.modo = modo;
  }
}

/** Elegir un modo: se pinta, se recuerda y se avisa a quien lo esté mirando. */
export function aplicarModo(modo: ModoPreferido): void {
  pintarModo(modo);

  try {
    if (modo === "auto") localStorage.removeItem(CLAVE_MODO);
    else localStorage.setItem(CLAVE_MODO, modo);
  } catch {
    // Se pierde al recargar, pero la sesión actual ya quedó con el modo puesto.
  }

  for (const avisar of escuchas) avisar();
}

const escuchas = new Set<() => void>();

/**
 * La preferencia es un dato del navegador, no del árbol de React: se lee con
 * `useSyncExternalStore` para que el servidor rinda "auto" (lo único que
 * puede saber) y el cliente corrija después de hidratar, sin desajuste.
 *
 * Escucha también el evento `storage`, que dispara el navegador cuando el
 * cambio viene de OTRA pestaña: dos pestañas abiertas del diario no se
 * quedan una clara y otra oscura.
 */
export function suscribirModo(alCambiar: () => void): () => void {
  escuchas.add(alCambiar);
  // Solo pinta y avisa: volver a escribir en `localStorage` desde acá haría
  // que las dos pestañas se dispararan el evento entre sí sin parar.
  const desdeOtraPestana = (evento: StorageEvent) => {
    if (evento.key !== CLAVE_MODO && evento.key !== null) return;
    pintarModo(leerModo());
    for (const avisar of escuchas) avisar();
  };
  window.addEventListener("storage", desdeOtraPestana);

  return () => {
    escuchas.delete(alCambiar);
    window.removeEventListener("storage", desdeOtraPestana);
  };
}
