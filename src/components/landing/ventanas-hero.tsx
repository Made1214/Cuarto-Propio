"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import logo from "@/assets/logo/logo.webp";

type IdVentana = "diario" | "audio" | "foto";

/**
 * El collage del hero: tres ventanitas Y2K que se pueden arrastrar (un poco,
 * sin salirse del collage) y cerrar, con un botón para volver a abrirlas.
 */
export function VentanasHero() {
  const t = useTranslations("landing");
  const [cerradas, setCerradas] = useState<Set<IdVentana>>(new Set());
  const [reinicio, setReinicio] = useState(0);
  const zSuperiorRef = useRef(35);
  /** La ventana que se agarra pasa al frente de las otras. */
  function subirAlFrente(): number {
    zSuperiorRef.current += 1;
    return zSuperiorRef.current;
  }

  function cerrar(id: IdVentana) {
    setCerradas((previas) => new Set(previas).add(id));
  }

  return (
    // Columna escalonada y no posiciones absolutas: las ventanitas se pisan
    // apenas por el borde (nunca la barra de título ni la ✕ de otra), con
    // cualquier ancho. Desde `sm` hay lugar para que la foto quede al costado
    // del diario en vez de debajo.
    <div className="mx-auto flex w-full max-w-[30rem] flex-col py-2 lg:col-span-6">
      {!cerradas.has("diario") && (
        <Ventana
          key={`diario-${reinicio}`}
          titulo={
            <>
              <span aria-hidden="true">📖</span> <span>{t("hero.win1Title")}</span>
            </>
          }
          alCerrar={() => cerrar("diario")}
          subirAlFrente={subirAlFrente}
          className="animate-float relative z-10 w-72 self-start"
          barra="px-3.5 py-2 text-xs"
        >
          <div className="space-y-2.5 p-4">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span>{t("hero.win1Date")}</span>
              <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)] px-2 py-0.5 font-medium text-[var(--text-primary)]">
                {t("hero.win1Tag")}
              </span>
            </div>
            <p className="font-literary text-sm leading-relaxed text-[var(--text-primary)] italic sm:text-base">
              {t("hero.win1Body")}
            </p>
          </div>
        </Ventana>
      )}

      {!cerradas.has("audio") && (
        <Ventana
          key={`audio-${reinicio}`}
          titulo={
            <>
              <span aria-hidden="true">🎙️</span> <span>{t("hero.win2Title")}</span>
            </>
          }
          alCerrar={() => cerrar("audio")}
          subirAlFrente={subirAlFrente}
          className="animate-float-3 relative z-30 order-3 -mt-3 ml-4 w-60 self-start sm:-mt-20 sm:ml-10"
          barra="px-3 py-1.5 text-[11px]"
        >
          <div className="flex items-center gap-2.5 p-3">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-xs font-bold text-[#3D2C4F]"
            >
              ▶
            </span>
            <div className="flex-1">
              <div className="text-xs font-medium text-[var(--text-primary)]">{t("hero.win2Desc")}</div>
              <div className="text-[11px] text-[var(--text-secondary)]">03:42 / 10:00</div>
            </div>
          </div>
        </Ventana>
      )}

      {!cerradas.has("foto") && (
        <Ventana
          key={`foto-${reinicio}`}
          titulo={<span>🖼️ pieza_12.jpg</span>}
          alCerrar={() => cerrar("foto")}
          subirAlFrente={subirAlFrente}
          className="animate-float-delayed relative z-20 order-2 -mt-3 w-44 self-end sm:-mt-24 sm:w-48"
          barra="px-3 py-1.5 text-[11px]"
        >
          <div className="space-y-1.5 p-2.5 text-center">
            <div className="h-28 overflow-hidden rounded-[var(--radius-inner)]">
              <Image
                src={logo}
                alt={t("altLogo")}
                sizes="192px"
                quality={90}
                draggable={false}
                className="h-full w-full object-cover object-[50%_58%]"
              />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">{t("hero.win3Caption")}</p>
          </div>
        </Ventana>
      )}

      {cerradas.size > 0 && (
        <button
          type="button"
          onClick={() => {
            setCerradas(new Set());
            setReinicio((n) => n + 1);
          }}
          className="theme-btn-secondary order-4 mt-4 min-h-11 self-center px-4 py-2 text-xs"
        >
          {t("hero.restore")}
        </button>
      )}
    </div>
  );
}

function Ventana({
  titulo,
  alCerrar,
  subirAlFrente,
  className,
  barra,
  children,
}: {
  titulo: React.ReactNode;
  alCerrar: () => void;
  subirAlFrente: () => number;
  className: string;
  barra: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("landing");
  const ventana = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ x: number; y: number } | null>(null);
  const posicion = useRef({ x: 0, y: 0 });

  function empezar(evento: React.PointerEvent<HTMLDivElement>) {
    // Desde la ✕ no se arrastra: se cierra.
    if ((evento.target as HTMLElement).closest("button")) return;
    const nodo = ventana.current;
    if (!nodo) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    nodo.style.zIndex = String(subirAlFrente());
    nodo.style.animation = "none";
    arrastre.current = {
      x: evento.clientX - posicion.current.x,
      y: evento.clientY - posicion.current.y,
    };
  }

  function mover(evento: React.PointerEvent<HTMLDivElement>) {
    const inicio = arrastre.current;
    const nodo = ventana.current;
    if (!inicio || !nodo) return;
    const x = Math.max(-90, Math.min(90, evento.clientX - inicio.x));
    const y = Math.max(-70, Math.min(70, evento.clientY - inicio.y));
    posicion.current = { x, y };
    nodo.style.transform = `translate(${x}px, ${y}px)`;
  }

  function soltar() {
    arrastre.current = null;
  }

  return (
    <div ref={ventana} className={`theme-card select-none ${className}`}>
      <div
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        className={`window-bar flex cursor-grab touch-none items-center justify-between active:cursor-grabbing ${barra}`}
      >
        <span className="flex items-center gap-1.5 font-semibold">{titulo}</span>
        <button
          type="button"
          onClick={alCerrar}
          aria-label={t("cerrarVentana")}
          className="flex h-7 min-w-7 items-center justify-center rounded text-sm hover:bg-black/15"
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  );
}
