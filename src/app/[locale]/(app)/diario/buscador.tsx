"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

/** Busca mientras se escribe, sin botón: el texto se manda a la URL con un
 * respiro de 350 ms para no disparar una consulta por tecla. El campo es
 * local, así que el foco y el cursor sobreviven a cada refresco. */
export function Buscador({ valorInicial, categoria }: { valorInicial: string; categoria?: string }) {
  const t = useTranslations("diario");
  const router = useRouter();
  const pathname = usePathname();
  const [texto, setTexto] = useState(valorInicial);
  const [, startTransition] = useTransition();
  const ultimoEnviado = useRef(valorInicial);

  useEffect(() => {
    if (texto === ultimoEnviado.current) return;

    const id = window.setTimeout(() => {
      ultimoEnviado.current = texto;
      const query: Record<string, string> = {};
      if (texto.trim()) query.q = texto.trim();
      if (categoria) query.categoria = categoria;
      startTransition(() => router.replace({ pathname, query }, { scroll: false }));
    }, 350);

    return () => window.clearTimeout(id);
  }, [texto, categoria, pathname, router]);

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
        className="w-65 max-w-full rounded-theme border-2 border-ink bg-card py-2.5 pr-3 pl-9 text-sm leading-none outline-none"
      />
    </div>
  );
}
