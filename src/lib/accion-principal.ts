"use client";

import { useEffect, useRef } from "react";

/**
 * La acción principal de cada sección (exhibir, grabar, nueva lista) se
 * dispara desde el botón del centro de la barra de abajo, al alcance del
 * pulgar, pero vive en un componente de la página. Este evento los conecta.
 *
 * Es un evento síncrono a propósito: `dispatchEvent` corre el oyente dentro
 * del mismo toque, y el navegador solo abre el selector de archivos o el
 * micrófono si se piden dentro de un toque de la usuaria.
 */
const EVENTO = "cuarto:accion-principal";

export type SeccionAccion = "listas" | "vitrina" | "audio";

/** Pide la acción de la sección. Devuelve `false` si nadie la atendió (la
 * página todavía no cargó), para que el botón haga otra cosa en su lugar. */
export function pedirAccionPrincipal(seccion: SeccionAccion): boolean {
  const evento = new CustomEvent(EVENTO, { detail: seccion, cancelable: true });
  return !window.dispatchEvent(evento);
}

/** Atiende la acción principal de `seccion` mientras `activo` sea true. Si
 * en la página hay dos componentes iguales (el del encabezado y el del
 * estado vacío), solo uno tiene que escuchar. */
export function useAccionPrincipal(seccion: SeccionAccion, alPedir: () => void, activo = true) {
  const ultimo = useRef(alPedir);
  useEffect(() => {
    ultimo.current = alPedir;
  });

  useEffect(() => {
    if (!activo) return;
    function oyente(evento: Event) {
      if ((evento as CustomEvent<SeccionAccion>).detail !== seccion) return;
      evento.preventDefault();
      ultimo.current();
    }
    window.addEventListener(EVENTO, oyente);
    return () => window.removeEventListener(EVENTO, oyente);
  }, [seccion, activo]);
}
