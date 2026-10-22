"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransicionBusqueda } from "./busqueda-pendiente";

/** Respiro entre la última tecla y la búsqueda: lo justo para no disparar una
 * consulta por tecla al escribir de corrido. Más largo se siente como que el
 * buscador no reacciona; el estado "buscando" cubre la espera igual. */
const RESPIRO_MS = 250;

/** Busca mientras se escribe, sin botón: el texto se manda a la URL después
 * de un respiro corto. El campo es local, así que el foco y el cursor
 * sobreviven a cada refresco. */
export function Buscador({ valorInicial, categoria }: { valorInicial: string; categoria?: string }) {
  const t = useTranslations("diario");
  const router = useRouter();
  const pathname = usePathname();
  const [texto, setTexto] = useState(valorInicial);
  // Lo último que se mandó a la URL (ya recortado). Es estado y no ref porque
  // también decide qué se pinta: "buscando" es cualquier diferencia con esto.
  const [enviado, setEnviado] = useState(valorInicial);
  // La transición vive en <ZonaBusqueda>, compartida con los resultados,
  // que se atenúan mientras dura.
  const { pendiente: isPending, iniciar: startTransition } = useTransicionBusqueda();

  // La búsqueda también cambia desde afuera: la equis del chip “término” o
  // "limpiar filtros" navegan a la URL sin `q`, y el campo seguía mostrando
  // el texto viejo. Se sincroniza solo si la URL trae algo distinto de lo que
  // mandó este mismo campo — si no, la respuesta a una búsqueda propia pisaría
  // lo que se siguió escribiendo mientras llegaba.
  const [valorPrevio, setValorPrevio] = useState(valorInicial);
  if (valorInicial !== valorPrevio) {
    setValorPrevio(valorInicial);
    if (valorInicial !== enviado) {
      setTexto(valorInicial);
      setEnviado(valorInicial);
    }
  }

  const termino = texto.trim();

  useEffect(() => {
    if (termino === enviado) return;

    const id = window.setTimeout(() => {
      setEnviado(termino);
      const query: Record<string, string> = {};
      if (termino) query.q = termino;
      if (categoria) query.categoria = categoria;
      // En una transición: la lista vieja se queda en pantalla (en vez del
      // esqueleto de `loading.tsx`) hasta que llegan los resultados, e
      // `isPending` avisa mientras tanto.
      startTransition(() => router.replace({ pathname, query }, { scroll: false }));
    }, RESPIRO_MS);

    return () => window.clearTimeout(id);
  }, [termino, enviado, categoria, pathname, router, startTransition]);

  // Desde la primera tecla hasta que llegan los resultados, sin hueco entre el
  // respiro y la respuesta del servidor.
  const buscando = isPending || termino !== enviado;

  return (
    <div className="relative">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted/70"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        aria-label={t("buscar")}
        placeholder={t("buscarPlaceholder")}
        className="w-65 max-w-full rounded-theme border-2 border-ink bg-card py-2.5 pr-8 pl-9 text-sm leading-none outline-none"
      />
      {/* El mismo cursor parpadeante de la barra de navegación, a la derecha
          del campo: "estoy buscando". Siempre en el DOM y con su lugar
          reservado (`pr-8`), así el texto no salta al aparecer. Cae dentro
          de ese relleno, a la derecha de la equis nativa del
          `type="search"`, que el navegador dibuja al final del contenido. */}
      <span
        aria-hidden="true"
        data-pendiente={buscando}
        className="cursor-pendiente pointer-events-none absolute top-1/2 right-3 h-3 w-1.5 -translate-y-1/2 bg-secondary-purple"
      />
    </div>
  );
}
