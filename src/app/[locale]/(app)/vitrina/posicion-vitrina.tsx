"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { IconoVolver } from "./iconos";

/**
 * Volver de una ficha a la Vitrina tal como se la dejó: con los mismos
 * filtros y en el mismo lugar del scroll.
 *
 * El «atrás» del navegador (o el gesto de deslizar en iOS) ya lo hacía solo.
 * El enlace «Volver a la vitrina» de la ficha, en cambio, llevaba a
 * `/vitrina` pelada: sin filtros, desde arriba y con la primera tanda nada
 * más. Ahora la pared va anotando en `sessionStorage` su URL (filtros y
 * `hasta` incluidos) y hasta dónde se bajó; el enlace vuelve a esa URL y la
 * pared, al montarse, baja a la misma altura. Las fotos reservan su alto
 * antes de cargar (ancho y alto en el `<img>`), así que la altura calza.
 *
 * Todo en `sessionStorage`: es de esta pestaña y de este rato, y si no se
 * puede leer (navegación privada, almacenamiento bloqueado) el enlace vuelve
 * a ser el de siempre.
 */
const CLAVE = "vitrina:posicion";
const CLAVE_VOLVER = "vitrina:volver";

type Posicion = { url: string; y: number };

function leer(): Posicion | null {
  try {
    const valor = JSON.parse(sessionStorage.getItem(CLAVE) ?? "null") as Posicion | null;
    return valor && typeof valor.url === "string" && typeof valor.y === "number" ? valor : null;
  } catch {
    return null;
  }
}

/** URL relativa sin el prefijo de idioma (el `Link` de next-intl lo pone). */
function urlActual(): string {
  const { pathname, search } = window.location;
  return pathname.replace(/^\/[a-z]{2}(?=\/)/, "") + search;
}

/** Va en la pared: anota la posición y, si se llega desde «Volver», la repone. */
export function RecordarPosicionVitrina() {
  useEffect(() => {
    const url = urlActual();
    try {
      const guardada = leer();
      if (sessionStorage.getItem(CLAVE_VOLVER) && guardada?.url === url) {
        // Después del scroll arriba que hace Next al navegar.
        requestAnimationFrame(() => window.scrollTo(0, guardada.y));
      }
      sessionStorage.removeItem(CLAVE_VOLVER);
    } catch {
      // Sin almacenamiento: la pared se abre desde arriba, como siempre.
    }

    let pendiente = 0;
    const anotar = () => {
      pendiente = 0;
      try {
        sessionStorage.setItem(CLAVE, JSON.stringify({ url: urlActual(), y: Math.round(window.scrollY) }));
      } catch {}
    };
    const alScroll = () => {
      if (!pendiente) pendiente = window.setTimeout(anotar, 150);
    };
    anotar();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", alScroll);
      if (pendiente) window.clearTimeout(pendiente);
    };
  }, []);

  return null;
}

/** El «Volver a la vitrina» de la ficha. Arranca apuntando a `/vitrina`
 * (lo mismo en el servidor y al hidratar) y, ya en el cliente, a la URL
 * que dejó anotada la pared. */
export function VolverAVitrina({ texto }: { texto: string }) {
  const [destino, setDestino] = useState("/vitrina");
  useEffect(() => {
    const guardada = leer();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage solo existe en el cliente
    if (guardada) setDestino(guardada.url);
  }, []);

  return (
    <Link
      href={destino}
      scroll={false}
      onClick={() => {
        try {
          sessionStorage.setItem(CLAVE_VOLVER, "1");
        } catch {}
      }}
      className="enlace-volver"
    >
      <IconoVolver />
      {texto}
    </Link>
  );
}
