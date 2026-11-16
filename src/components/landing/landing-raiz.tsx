"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAlternarModo } from "@/lib/temas/use-modo";

const FORMAS_DESTELLO = ["✦", "✧", "⋆", "✿"];

function sinMovimiento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * La raíz de la landing: se encarga de lo que mira toda la página a la vez
 * (aparecer al bajar y los destellos del cursor). El contenido llega ya
 * rendido desde el servidor.
 *
 * La página tiene una sola identidad (Whimsical, con sus tokens propios en
 * landing.css): mostrar los temas de la app es trabajo del probador
 * (`probador.tsx`), que viste solo su maqueta con los temas reales.
 */
export function LandingRaiz({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const raiz = useRef<HTMLDivElement>(null);

  // Aparecer al bajar.
  useEffect(() => {
    const nodo = raiz.current;
    if (!nodo) return;
    nodo.dataset.js = "";

    const aparecer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add("is-visible");
          aparecer.unobserve(entrada.target);
        }
      },
      // Antes de que la sección entre del todo: bajando rápido ya está
      // visible cuando se la mira, nunca a media opacidad.
      { threshold: 0, rootMargin: "0px 0px 15% 0px" },
    );
    nodo.querySelectorAll(".reveal-section").forEach((s) => aparecer.observe(s));
    return () => aparecer.disconnect();
  }, []);

  // Destellos que siguen al mouse (nunca con táctil ni con «reducir movimiento»).
  useEffect(() => {
    let ultimo = 0;
    function alMover(evento: PointerEvent) {
      if (evento.pointerType !== "mouse" || sinMovimiento()) return;
      const ahora = Date.now();
      if (ahora - ultimo < 65) return;
      ultimo = ahora;
      const nodo = raiz.current;
      if (!nodo) return;
      const estilo = getComputedStyle(nodo);
      const colores = ["--sparkle-color-1", "--sparkle-color-2", "--sparkle-color-3"].map((v) =>
        estilo.getPropertyValue(v),
      );
      const destello = document.createElement("span");
      destello.className = "cursor-sparkle";
      destello.setAttribute("aria-hidden", "true");
      destello.textContent = FORMAS_DESTELLO[Math.floor(Math.random() * FORMAS_DESTELLO.length)];
      destello.style.color = colores[Math.floor(Math.random() * colores.length)];
      destello.style.left = `${evento.clientX}px`;
      destello.style.top = `${evento.clientY}px`;
      destello.style.fontSize = `${12 + Math.random() * 10}px`;
      document.body.appendChild(destello);
      window.setTimeout(() => destello.remove(), 760);
    }
    window.addEventListener("pointermove", alMover);
    return () => window.removeEventListener("pointermove", alMover);
  }, []);

  return (
    <div ref={raiz} data-theme="whimsical" className={className}>
      {children}
    </div>
  );
}

export function BotonModo() {
  const t = useTranslations("landing");
  const [oscuro, alternar] = useAlternarModo();
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={t("modoClaroOscuro")}
      aria-pressed={oscuro}
      className="theme-btn-secondary flex h-11 w-11 shrink-0 items-center justify-center"
    >
      {oscuro ? (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
