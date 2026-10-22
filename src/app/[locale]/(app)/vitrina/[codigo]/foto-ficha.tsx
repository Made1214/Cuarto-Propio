"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * La foto grande de la ficha, con su miniatura debajo mientras baja.
 *
 * La versión completa pesa varias veces lo que la miniatura, y en el celular
 * tarda en llegar. Pero quien abre una ficha casi siempre viene de la
 * cuadrícula, donde ya bajó la miniatura de esa misma pieza — con la misma
 * URL, porque las firmas son estables (`src/lib/storage/firmas.ts`) — así
 * que está en el caché del navegador. Pintarla de fondo, estirada al tamaño
 * de la foto, hace que la pieza se vea en el acto (un poco más suave) y que
 * la nítida aparezca encima cuando termina de llegar, en vez de un marco
 * vacío.
 *
 * El fondo se saca al terminar de cargar: en una pieza con partes
 * transparentes la miniatura se asomaría por debajo con los bordes
 * borrosos. Es componente de cliente solo por eso (el `onLoad`); si la foto
 * ya había cargado antes de hidratar, next/image avisa igual al hidratar.
 */
export function FotoFicha({
  completaUrl,
  miniaturaUrl,
  alt,
  ancho,
  alto,
  altoMaximo,
}: {
  completaUrl: string;
  miniaturaUrl: string | null;
  alt: string;
  ancho: number;
  alto: number;
  altoMaximo: string;
}) {
  const [cargada, setCargada] = useState(false);

  return (
    <Image
      src={completaUrl}
      alt={alt}
      width={ancho}
      height={alto}
      // Igual que en la cuadrícula: la versión que sirve Storage ya salió
      // del pipeline de `sharp`, y la URL firmada se renueva cada pocas
      // horas, así que el optimizador no aportaría nada.
      unoptimized
      // Es la imagen principal (el LCP de la ficha): se pide ya y antes que
      // todo lo demás. `priority` está deprecado desde Next 16; la doc
      // recomienda `loading` + `fetchPriority` en vez de `preload` salvo que
      // haga falta adelantarla al <head>, y acá el <img> ya llega en el HTML
      // del servidor.
      loading="eager"
      fetchPriority="high"
      onLoad={() => setCargada(true)}
      onError={() => setCargada(true)}
      style={{
        maxHeight: altoMaximo,
        ...(miniaturaUrl && !cargada
          ? {
              backgroundImage: `url("${miniaturaUrl}")`,
              // Misma proporción que la foto: estirarla al 100% calza justo.
              backgroundSize: "100% 100%",
            }
          : null),
      }}
      className="h-auto w-auto max-w-full object-contain"
    />
  );
}
