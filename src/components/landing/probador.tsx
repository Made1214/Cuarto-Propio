"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import marca from "@/assets/logo/marca.webp";
import { Link } from "@/i18n/navigation";
import { CONFIG_POR_DEFECTO, type ConfigTema } from "@/lib/temas/config";
import { generarCssTema } from "@/lib/temas/css";
import { CURSORES, type CursorId } from "@/lib/temas/cursores";
import { FUENTES_DIARIO, type FuenteDiarioId } from "@/lib/temas/fuentes";
import { TEMAS_DISPONIBLES, type PresetId } from "@/lib/temas/presets";
import { BotonModo } from "./landing-raiz";
import { RUTA_REGISTRO } from "./rutas";

/**
 * El probador de la landing: una maqueta chiquita de la app (barra, título,
 * filtros y una entrada del diario) que se viste con los temas REALES de
 * Personalización —los mismos tokens de src/lib/temas/presets.ts y la misma
 * decoración de temas.css—, mientras el resto de la página conserva su
 * identidad. Mientras se ve, la maqueta va pasando sola por los temas (cada
 * pocos segundos, y se detiene al pasar el mouse por encima); apenas se toca
 * cualquier cosa del probador, se queda quieta y manda la usuaria. Con
 * «reducir movimiento» no rota nunca.
 *
 * El tema elegido viaja al registro (`/registro?tema=void`) y es con el que
 * se crea la cuenta (ver src/lib/temas/inicial.ts).
 */

/** El orden en que se recorren: primero el de fábrica de la app. */
export const TEMAS_PROBADOR: PresetId[] = ["retro", "whimsical", "softsignal", "void"];

const FUENTES_MUESTRA: FuenteDiarioId[] = ["lora", "caveat", "maquina", "mono"];
const CURSORES_MUESTRA: CursorId[] = ["corazon", "estrella", "lapiz"];
const ACENTOS = ["#D6457A", "#2E9E83", "#4C6EF5", "#E8772E"] as const;

const SELECTOR = ".muestra-tema";
/** Cuánto se queda cada tema en la maqueta mientras rota sola. */
const MS_POR_TEMA = 4500;

function sinMovimiento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Cambia el estado con un fundido si el navegador sabe hacerlo (View
 * Transitions) y no se pidió reducir el movimiento. */
function conFundido(cambio: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || sinMovimiento()) return cambio();
  doc.startViewTransition(() => flushSync(cambio));
}

export function Probador() {
  const t = useTranslations("landing.probador");
  const [tema, setTema] = useState<PresetId>("retro");
  const [auto, setAuto] = useState(true);
  const [fuente, setFuente] = useState<FuenteDiarioId | null>(null);
  const [acento, setAcento] = useState<string | null>(null);
  const [cursor, setCursor] = useState<CursorId | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [encima, setEncima] = useState(false);
  const rotando = auto && visible && !encima;

  // Solo rota mientras el probador está en pantalla.
  useEffect(() => {
    const nodo = raiz.current;
    if (!nodo || sinMovimiento()) return;
    const observador = new IntersectionObserver(([entrada]) => setVisible(entrada.isIntersecting), {
      threshold: 0.35,
    });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (!rotando) return;
    const temporizador = window.setTimeout(() => {
      setTema((actual) => TEMAS_PROBADOR[(TEMAS_PROBADOR.indexOf(actual) + 1) % TEMAS_PROBADOR.length]);
    }, MS_POR_TEMA);
    return () => window.clearTimeout(temporizador);
  }, [rotando, tema]);

  function elegir(id: PresetId) {
    setAuto(false);
    conFundido(() => setTema(id));
  }

  const css = useMemo(() => {
    const propios = acento ? { secundarioMorado: acento } : {};
    const config: ConfigTema = {
      ...CONFIG_POR_DEFECTO,
      preset: tema,
      colores: { claro: propios, oscuro: propios },
      fuenteDiario: fuente,
      cursor: cursor ? { tipo: "preset", id: cursor } : null,
    };
    return generarCssTema(config, `${SELECTOR}[data-tema="${tema}"]`);
  }, [tema, fuente, acento, cursor]);

  const nombre = TEMAS_DISPONIBLES[tema].nombre;

  // Cualquier clic dentro del probador (tema, letra, acento, cursor) para la
  // rotación: desde ahí la que elige es ella. Clic y no `pointerdown`, para
  // que bajar la página con el dedo por encima no cuente como elegir.
  const detener = () => setAuto(false);

  return (
    <div
      ref={raiz}
      onClickCapture={detener}
      className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-5"
    >
      {/* Estilos del tema de la maqueta, colgados solo de ella. Solo llevan
          valores de las listas cerradas de src/lib/temas/. */}
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div
        onPointerEnter={(e) => e.pointerType === "mouse" && setEncima(true)}
        onPointerLeave={() => setEncima(false)}
        className="space-y-3 lg:col-span-7 lg:col-start-6 lg:row-start-1"
      >
        <p aria-live="polite" className="text-center text-sm font-semibold text-[var(--text-primary)]">
          {t("asiSeVeria", { tema: nombre })}
        </p>
        <Maqueta tema={tema} />
      </div>

      {/* Los temas: tarjetas con su descripción en escritorio, chips en el
          celular. Todos a la vista: elegir es un toque, no bajar la página. */}
      <div className="space-y-4 lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <div role="group" aria-label={t("temasGrupo")} className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {TEMAS_PROBADOR.map((id) => {
            const activo = id === tema;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={activo}
                onClick={() => elegir(id)}
                className={`relative min-h-11 overflow-hidden rounded-[var(--radius-inner)] border px-3 py-2 text-left transition-colors lg:px-4 lg:py-3 ${
                  activo
                    ? "border-[var(--btn-bg)] bg-[var(--btn-bg)] text-[var(--btn-text)]"
                    : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-alt)]"
                }`}
              >
                <span className="block text-sm font-semibold lg:text-base">{TEMAS_DISPONIBLES[id].nombre}</span>
                <span className={`hidden text-xs leading-snug lg:block ${activo ? "opacity-90" : "text-[var(--text-secondary)]"}`}>
                  {t(`temas.${id}`)}
                </span>
                {/* Cuánto falta para el próximo tema mientras rota sola. */}
                {activo && auto && visible ? (
                  <span
                    key={tema}
                    aria-hidden="true"
                    className="probador-progreso absolute inset-x-0 bottom-0 h-1 origin-left bg-[var(--btn-text)]/45"
                    style={{
                      animationDuration: `${MS_POR_TEMA}ms`,
                      animationPlayState: rotando ? "running" : "paused",
                    }}
                  />
                ) : null}
              </button>
            );
          })}
          <span
            aria-disabled="true"
            className="col-span-2 flex min-h-11 cursor-not-allowed flex-col justify-center rounded-[var(--radius-inner)] border border-dashed border-[var(--border-color)] px-3 py-2 opacity-60 lg:col-span-1 lg:px-4"
          >
            <span className="text-sm font-semibold">Fairy · {t("pronto")}</span>
            <span className="hidden text-xs leading-snug text-[var(--text-secondary)] lg:block">{t("temas.fairy")}</span>
          </span>
        </div>

        <p className="text-sm leading-relaxed text-[var(--text-secondary)] lg:hidden">{t(`temas.${tema}`)}</p>

        {/* Más que el tema: letra, acento y cursor propios. */}
        <div className="theme-surface-alt space-y-3 p-4">
          <Fila etiqueta={t("letra")}>
            <BotonOpcion activo={fuente === null} onClick={() => setFuente(null)}>
              {t("delTema")}
            </BotonOpcion>
            {FUENTES_MUESTRA.map((id) => (
              <BotonOpcion key={id} activo={fuente === id} onClick={() => setFuente(id)}>
                <span style={{ fontFamily: `var(${FUENTES_DIARIO[id].variable}), ${FUENTES_DIARIO[id].respaldo}` }}>
                  {FUENTES_DIARIO[id].nombre}
                </span>
              </BotonOpcion>
            ))}
          </Fila>
          <Fila etiqueta={t("acento")}>
            <BotonOpcion activo={acento === null} onClick={() => setAcento(null)}>
              {t("delTema")}
            </BotonOpcion>
            {ACENTOS.map((color, i) => (
              <button
                key={color}
                type="button"
                aria-label={t(`acentos.${i}`)}
                aria-pressed={acento === color}
                onClick={() => setAcento(color)}
                className={`h-11 w-11 shrink-0 rounded-full border-2 border-[var(--text-primary)] transition-transform hover:scale-105 ${
                  acento === color ? "ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-surface-alt)]" : ""
                }`}
                style={{ background: color }}
              />
            ))}
          </Fila>
          <Fila etiqueta={t("cursor")} className="hidden puntero-fino:flex">
            <BotonOpcion activo={cursor === null} onClick={() => setCursor(null)}>
              {t("cursorNormal")}
            </BotonOpcion>
            {CURSORES_MUESTRA.map((id) => (
              <BotonOpcion key={id} activo={cursor === id} onClick={() => setCursor(id)} etiqueta={t(`cursores.${id}`)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- ícono de 32 px de public/ */}
                <img src={CURSORES[id].archivo} alt="" width={22} height={22} />
              </BotonOpcion>
            ))}
            <span className="text-[11px] text-[var(--text-secondary)]">{t("cursorAyuda")}</span>
          </Fila>
          <Fila etiqueta={t("modo")}>
            <BotonModo />
          </Fila>
        </div>
      </div>

        <div className="flex flex-col items-center gap-2 text-center lg:col-span-7 lg:col-start-6 lg:row-start-2 lg:self-start">
          <Link
            href={{ pathname: RUTA_REGISTRO, query: { tema } }}
            className="theme-btn-primary inline-flex min-h-12 items-center px-6 py-3 text-sm font-semibold sm:text-base"
          >
            {t("cta", { tema: nombre })}
          </Link>
          <p className="text-xs text-[var(--text-secondary)]">{t("ctaNota")}</p>
        </div>
    </div>
  );
}

function Fila({
  etiqueta,
  children,
  className = "flex",
}: {
  etiqueta: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="group" aria-label={etiqueta} className={`${className} flex-wrap items-center gap-2`}>
      <span className="w-16 shrink-0 text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">
        {etiqueta}
      </span>
      {children}
    </div>
  );
}

function BotonOpcion({
  activo,
  onClick,
  etiqueta,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  etiqueta?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      aria-label={etiqueta}
      onClick={onClick}
      className={`flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--border-color)] px-3 text-xs font-semibold transition-colors ${
        activo ? "bg-[var(--btn-bg)] text-[var(--btn-text)]" : "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-alt)]"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * La app en miniatura. Usa las mismas clases que la app de verdad
 * (`bg-card`, `border-ink`, `rounded-theme`, `tema-barra`, `tema-panel`…),
 * así cada tema se ve acá exactamente como se verá adentro.
 */
function Maqueta({ tema }: { tema: PresetId }) {
  const t = useTranslations("landing.probador.maqueta");
  const tProbador = useTranslations("landing.probador");
  const chip =
    "tema-chip flex h-8 shrink-0 items-center border-(length:--borde) border-ink rounded-theme px-2.5 text-[12px] whitespace-nowrap";

  return (
    <div
      role="img"
      aria-label={tProbador("maquetaAlt", { tema: TEMAS_DISPONIBLES[tema].nombre })}
      data-tema={tema}
      className="muestra-tema overflow-hidden border-(length:--borde-grueso) border-ink rounded-theme bg-background font-sans text-foreground shadow-marco-lg"
      style={{ viewTransitionName: "muestra-tema" }}
    >
      <div className="tema-barra flex h-12 items-center justify-between gap-2 border-b-(length:--borde-grueso) border-ink bg-secondary-purple px-3">
        <span className="flex min-w-0 items-center gap-2">
          <Image
            src={marca}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded-theme border-(length:--borde) border-ink object-cover"
          />
          <span className="tema-marca truncate font-pixel text-[11px] tracking-wide text-background">CUARTO PROPIO</span>
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <span
            aria-current="page"
            className="tema-nav-link relative flex h-8 items-center border-(length:--borde) border-ink bg-background px-2.5 text-[12px] font-bold text-foreground"
          >
            {t("diario")}
          </span>
          {(["listas", "vitrina", "audio"] as const).map((s) => (
            <span
              key={s}
              className="tema-nav-link relative flex h-8 items-center border-(length:--borde) border-transparent px-2.5 text-[12px] font-medium text-background"
            >
              {t(s)}
            </span>
          ))}
        </span>
        {/* Sin foto de perfil, la app muestra la inicial del nombre: acá
            también, igual que el avatar de la barra (src/components/perfil/avatar.tsx). */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-primary-pink font-pixel text-[11px] leading-none text-ink-strong">
          {t("inicial")}
        </span>
      </div>

      <div className="p-3 sm:p-5">
        <div className="tema-contenido flex flex-col gap-3">
          <p className="tema-titulo font-diario text-3xl font-bold text-secondary-purple">{t("diario")}</p>
          <div className="flex gap-2 overflow-hidden">
            <span className={`${chip} tema-chip-activo bg-secondary-purple font-semibold text-background`}>{t("todas")}</span>
            <span className={`${chip} bg-card font-medium text-ink`}>{t("cat1")}</span>
            <span className={`${chip} bg-card font-medium text-ink`}>{t("cat2")}</span>
          </div>
          {(
            [
              ["14", t("dia1"), t("titulo1"), t("texto1"), "bg-primary-green"],
              ["11", t("dia2"), t("titulo2"), t("texto2"), "bg-primary-pink"],
            ] as const
          ).map(([dia, semana, titulo, texto, color]) => (
            <div
              key={dia}
              className="tema-panel flex gap-4 border-(length:--borde) border-ink rounded-theme bg-card p-4 shadow-marco"
            >
              <span className="tema-lcd flex w-11 shrink-0 flex-col items-center pt-0.5">
                <span className="font-pixel text-[22px] leading-none">{dia}</span>
                <span className="mt-1.5 text-[11px] font-semibold text-secondary-purple uppercase">{semana}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <span className={`h-2 w-2 shrink-0 border-[1.5px] border-ink-strong ${color}`} />
                  {dia === "14" ? t("cat1") : t("cat2")}
                </span>
                <span className="font-diario text-lg leading-snug font-semibold">{titulo}</span>
                <span className="line-clamp-2 font-diario text-[15px] leading-relaxed text-muted/80">{texto}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
