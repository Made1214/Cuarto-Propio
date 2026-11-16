"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslations } from "next-intl";
import { useModo } from "@/lib/temas/use-modo";

export const TEMAS_LANDING = ["whimsical", "retro", "fairy", "emo"] as const;
export type TemaLanding = (typeof TEMAS_LANDING)[number];

export const META_TEMAS: Record<TemaLanding, { emoji: string; nombre: string }> = {
  whimsical: { emoji: "🌿", nombre: "Whimsical" },
  retro: { emoji: "🪟", nombre: "Retro 98" },
  fairy: { emoji: "🧚", nombre: "Fairy" },
  emo: { emoji: "🥀", nombre: "Emo" },
};

const FORMAS_DESTELLO = ["✦", "✧", "⋆", "✿"];

type Estado = {
  tema: TemaLanding;
  /** Elegir un tema a mano apaga el cambio automático al bajar. */
  elegirTema: (tema: TemaLanding) => void;
  acento: string | null;
  setAcento: (color: string) => void;
  autoScroll: boolean;
  setAutoScroll: (valor: boolean) => void;
  destellos: boolean;
  setDestellos: (valor: boolean) => void;
};

const Contexto = createContext<Estado | null>(null);

export function useLanding() {
  const estado = useContext(Contexto);
  if (!estado) throw new Error("useLanding va dentro de <LandingRaiz>");
  return estado;
}

function sinMovimiento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * La raíz de la landing: guarda el tema de demostración, el color de acento
 * y los destellos, y se encarga de lo que mira toda la página a la vez
 * (aparecer al bajar, cambiar de tema según la sección que se ve y los
 * destellos del cursor). El contenido llega ya rendido desde el servidor.
 *
 * Nada de esto se guarda: es una vitrina de cómo puede verse un cuarto. Los
 * temas de la app de verdad son otros (src/lib/temas/).
 */
export function LandingRaiz({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const [tema, setTema] = useState<TemaLanding>("whimsical");
  const [acento, setAcentoEstado] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [destellos, setDestellos] = useState(true);
  const autoScrollRef = useRef(autoScroll);
  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  const cambiarTema = useCallback((nuevo: TemaLanding) => {
    // El acento elegido a mano se suelta al cambiar de tema, para que se vean
    // los colores propios del tema nuevo.
    setAcentoEstado(null);
    setTema(nuevo);
  }, []);

  const elegirTema = useCallback(
    (nuevo: TemaLanding) => {
      setAutoScroll(false);
      cambiarTema(nuevo);
    },
    [cambiarTema],
  );

  // Aparecer al bajar + tema por sección.
  useEffect(() => {
    const nodo = raiz.current;
    if (!nodo) return;
    nodo.dataset.js = "";

    const aparecer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) entrada.target.classList.add("is-visible");
        }
      },
      { threshold: 0.12 },
    );
    nodo.querySelectorAll(".reveal-section").forEach((s) => aparecer.observe(s));

    const porSeccion = new IntersectionObserver(
      (entradas) => {
        if (!autoScrollRef.current) return;
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          const elegido = (entrada.target as HTMLElement).dataset.sectionTheme;
          if (elegido && (TEMAS_LANDING as readonly string[]).includes(elegido)) {
            cambiarTema(elegido as TemaLanding);
          }
        }
      },
      { threshold: 0.48 },
    );
    nodo.querySelectorAll("[data-section-theme]").forEach((s) => porSeccion.observe(s));

    return () => {
      aparecer.disconnect();
      porSeccion.disconnect();
    };
  }, [cambiarTema]);

  // Destellos que siguen al mouse (nunca con táctil ni con «reducir movimiento»).
  useEffect(() => {
    if (!destellos) return;
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
  }, [destellos]);

  const estiloAcento = acento
    ? ({ "--accent-primary": acento, "--sparkle-color-1": acento } as React.CSSProperties)
    : undefined;

  return (
    <Contexto
      value={{
        tema,
        elegirTema,
        acento,
        setAcento: setAcentoEstado,
        autoScroll,
        setAutoScroll,
        destellos,
        setDestellos,
      }}
    >
      <div ref={raiz} data-theme={tema} style={estiloAcento} className={className}>
        {children}
      </div>
    </Contexto>
  );
}

function suscribirSistema(alCambiar: () => void) {
  const consulta = window.matchMedia("(prefers-color-scheme: dark)");
  consulta.addEventListener("change", alCambiar);
  return () => consulta.removeEventListener("change", alCambiar);
}

/**
 * Claro ↔ oscuro con un solo botón. Es el mismo ajuste del perfil de la app
 * (se guarda en este dispositivo): si estaba en «auto», el primer toque fija
 * lo contrario de lo que se está viendo.
 */
export function useAlternarModo(): [boolean, () => void] {
  const [modo, elegir] = useModo();
  const sistemaOscuro = useSyncExternalStore(
    suscribirSistema,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  const oscuro = modo === "auto" ? sistemaOscuro : modo === "oscuro";
  return [oscuro, () => elegir(oscuro ? "claro" : "oscuro")];
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
      className="theme-btn-secondary flex items-center justify-center p-2"
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

/** Los cuatro botones de tema (en el selector flotante y en Personalización). */
export function BotonesTema({ variante }: { variante: "cajon" | "panel" }) {
  const { tema, elegirTema } = useLanding();
  return (
    <div className="grid grid-cols-2 gap-2">
      {TEMAS_LANDING.map((id) => {
        const activo = id === tema;
        const { emoji, nombre } = META_TEMAS[id];
        return (
          <button
            key={id}
            type="button"
            aria-pressed={activo}
            onClick={() => elegirTema(id)}
            className={
              variante === "cajon"
                ? `flex items-center gap-1.5 rounded-[var(--radius-inner)] border border-[var(--border-color)] px-2.5 py-2 text-left text-xs font-medium ${
                    activo ? "bg-[var(--bg-surface-alt)] font-semibold" : ""
                  }`
                : `px-3 py-2 text-left text-xs font-semibold ${
                    activo ? "theme-btn-primary" : "theme-btn-secondary"
                  }`
            }
          >
            <span aria-hidden="true">{emoji}</span> <span>{nombre}</span>
          </button>
        );
      })}
    </div>
  );
}

/** El botón flotante de abajo a la derecha, con su cajón de temas. */
export function SelectorFlotante() {
  const t = useTranslations("landing");
  const { tema, autoScroll, setAutoScroll } = useLanding();
  const [abierto, setAbierto] = useState(false);
  const { emoji, nombre } = META_TEMAS[tema];

  return (
    <aside
      aria-label={t("selector")}
      className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2"
    >
      {abierto ? (
        <div id="cajon-temas" className="theme-card mb-1 w-64 p-3.5 sm:w-72">
          <div className="mb-2.5 flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">
              {t("switcher.title")}
            </span>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label={t("cerrarSelector")}
              className="rounded px-1.5 py-0.5 text-xs hover:bg-[var(--bg-surface-alt)]"
            >
              ✕
            </button>
          </div>
          <div className="mb-3">
            <BotonesTema variante="cajon" />
          </div>
          <label className="flex cursor-pointer items-center justify-between pt-1 text-xs text-[var(--text-secondary)]">
            <span>{t("switcher.autoScroll")}</span>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="h-4 w-4 rounded accent-[var(--btn-bg)]"
            />
          </label>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="cajon-temas"
        className="theme-btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold shadow-lg sm:text-sm"
      >
        <span aria-hidden="true">{emoji}</span>
        <span>{t("switcher.btn")}</span>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] tracking-wider uppercase">
          {nombre}
        </span>
      </button>
    </aside>
  );
}
