"use client";

import { useSyncExternalStore } from "react";

/**
 * Qué listas están abiertas en este dispositivo. Con muchas listas el
 * tablero arrancaba con miles de filas y cientos de botones a la vez; ahora
 * cada lista puede quedar plegada (nombre y "3 de 8 hechos") y se abre al
 * tocarla. Lo que se abrió o se plegó a mano se recuerda acá, por lista, en
 * `localStorage`: es una comodidad de cada dispositivo, no de la cuenta.
 */
const CLAVE = "cuarto-propio:listas-plegado";
const oyentes = new Set<() => void>();
let cache: Record<string, boolean> | null = null;

function leer(): Record<string, boolean> {
  if (cache) return cache;
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    cache = crudo ? (JSON.parse(crudo) as Record<string, boolean>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

function guardar(id: string, abierta: boolean) {
  cache = { ...leer(), [id]: abierta };
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(cache));
  } catch {
    // Sin almacenamiento: vale para esta visita y listo.
  }
  oyentes.forEach((oyente) => oyente());
}

/** `[abierta, cambiar]`. Sin elección guardada, `porDefecto` (lo decide la
 * página según cuántas listas hay). En el servidor siempre `porDefecto`. */
export function useListaAbierta(id: string, porDefecto: boolean): [boolean, (abierta: boolean) => void] {
  const elegida = useSyncExternalStore(
    suscribir,
    () => leer()[id],
    () => undefined,
  );
  return [elegida ?? porDefecto, (abierta) => guardar(id, abierta)];
}
