"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  aplicarModo,
  leerModo,
  MODO_POR_DEFECTO,
  suscribirModo,
  type ModoPreferido,
} from "./modo";

/**
 * El modo claro/oscuro/auto elegido en este dispositivo, más la función para
 * cambiarlo. Lo comparten el selector del panel de perfil y el de la landing.
 *
 * La preferencia se lee del navegador con `useSyncExternalStore` y no con
 * estado propio: el servidor no puede saber qué eligió esta persona, así
 * que rinde "auto" y el cliente corrige apenas hidrata, sin desajuste.
 */
export function useModo(): [ModoPreferido, (modo: ModoPreferido) => void] {
  const modo = useSyncExternalStore(suscribirModo, leerModo, () => MODO_POR_DEFECTO);

  useLayoutEffect(() => {
    // En desarrollo, el remontaje de Strict Mode borra del <html> los
    // atributos que React no maneja desde el JSX, incluido el que puso el
    // script del <head>. En producción esto es un no-op: ya estaba puesto.
    aplicarModo(leerModo());
  }, []);

  return [modo, aplicarModo];
}
