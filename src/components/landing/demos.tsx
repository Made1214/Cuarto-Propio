"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BotonesTema, useAlternarModo, useLanding } from "./landing-raiz";

/* Maquetas interactivas de los cinco módulos. Son demostraciones: nada se
   guarda, todo vuelve a su estado al recargar. */

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`px-3 py-1 text-xs ${activo ? "theme-btn-primary font-semibold" : "theme-btn-secondary font-medium"}`}
    >
      {children}
    </button>
  );
}

const ENTRADAS = [
  { n: 1, cat: "cat3", fecha: "14 Nov", icono: "✿" },
  { n: 2, cat: "cat1", fecha: "11 Nov", icono: "☾" },
  { n: 3, cat: "cat2", fecha: "07 Nov", icono: "📖" },
] as const;

export function DemoDiario() {
  const t = useTranslations("landing.mod1");
  const [filtro, setFiltro] = useState<"todas" | "cat1" | "cat2" | "cat3">("todas");

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Chip activo={filtro === "todas"} onClick={() => setFiltro("todas")}>
          {t("catAll")}
        </Chip>
        {(["cat1", "cat2", "cat3"] as const).map((c) => (
          <Chip key={c} activo={filtro === c} onClick={() => setFiltro(c)}>
            {t(c)}
          </Chip>
        ))}
      </div>
      <div className="space-y-3">
        {ENTRADAS.filter((e) => filtro === "todas" || e.cat === filtro).map((e) => (
          <article key={e.n} className="theme-surface-alt space-y-1.5 p-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>
                {e.fecha} • <strong className="text-[var(--text-primary)]">{t(e.cat)}</strong>
              </span>
              <span aria-hidden="true">{e.icono}</span>
            </div>
            <h4 className="font-literary text-base font-semibold text-[var(--text-primary)] sm:text-lg">
              {t(`entry${e.n}Title`)}
            </h4>
            <p className="font-literary text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              {t(`entry${e.n}Text`)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ItemCheck({
  texto,
  marcado,
  alCambiar,
}: {
  texto: string;
  marcado: boolean;
  alCambiar: (valor: boolean) => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={marcado}
          onChange={(e) => alCambiar(e.target.checked)}
          className="h-4 w-4 accent-[var(--btn-bg)]"
        />
        <span className={marcado ? "line-through opacity-75" : ""}>{texto}</span>
      </label>
    </li>
  );
}

export function DemoListas() {
  const t = useTranslations("landing");
  const [libros, setLibros] = useState([true, true, false]);
  const [ideas, setIdeas] = useState<{ texto: string; marcado: boolean }[]>([
    { texto: t("mod2.costume1"), marcado: true },
    { texto: t("mod2.costume2"), marcado: false },
  ]);
  const [nueva, setNueva] = useState("");
  const titulosLibros = ["Un cuarto propio — V. Woolf", "La campana de cristal — S. Plath", t("mod2.book3")];

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
      <div className="theme-surface-alt space-y-2.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-[var(--text-primary)] sm:text-sm">{t("mod2.board1")}</h4>
          <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)] px-2 py-0.5 text-[11px] font-semibold">
            {libros.filter(Boolean).length}/{libros.length}
          </span>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm">
          {titulosLibros.map((titulo, i) => (
            <ItemCheck
              key={i}
              texto={titulo}
              marcado={libros[i]}
              alCambiar={(v) => setLibros((prev) => prev.map((x, j) => (j === i ? v : x)))}
            />
          ))}
        </ul>
      </div>

      <div className="theme-surface-alt space-y-2.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-[var(--text-primary)] sm:text-sm">{t("mod2.board2")}</h4>
          <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-secondary)_45%,transparent)] px-2 py-0.5 text-[11px] font-semibold">
            {t("ideas")}
          </span>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm">
          {ideas.map((idea, i) => (
            <ItemCheck
              key={i}
              texto={idea.texto}
              marcado={idea.marcado}
              alCambiar={(v) =>
                setIdeas((prev) => prev.map((x, j) => (j === i ? { ...x, marcado: v } : x)))
              }
            />
          ))}
        </ul>
        <form
          className="flex gap-1.5 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            const texto = nueva.trim();
            if (!texto) return;
            setIdeas((prev) => [...prev, { texto, marcado: false }]);
            setNueva("");
          }}
        >
          <input
            type="text"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            maxLength={38}
            placeholder={t("mod2.placeholder")}
            aria-label={t("mod2.placeholder")}
            className="w-full rounded-[var(--radius-inner)] border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
          />
          <button type="submit" aria-label={t("mod2.placeholder")} className="theme-btn-primary px-3 py-1.5 text-xs font-bold">
            +
          </button>
        </form>
      </div>
    </div>
  );
}

const PIEZAS = [
  { n: 1, tag: "acuarela", alto: "h-32", fondo: "bg-gradient-to-br from-[#F0AEC4]/60 to-[#9BCFAE]/60", forma: "gota" },
  { n: 2, tag: "luz-de-tarde", alto: "h-24", fondo: "bg-gradient-to-tr from-[#74C7C3]/55 to-[#F0AEC4]/45", forma: "ventana" },
  { n: 3, tag: "collage", alto: "h-24", fondo: "bg-gradient-to-bl from-[#9BCFAE]/60 to-[#74C7C3]/50", forma: "estrella" },
  { n: 4, tag: "acuarela", alto: "h-32", fondo: "bg-gradient-to-tl from-[#F0AEC4]/65 to-[#74C7C3]/45", forma: "cara" },
] as const;

function Forma({ forma }: { forma: (typeof PIEZAS)[number]["forma"] }) {
  const trazo = { stroke: "var(--text-primary)", strokeWidth: 2 };
  return (
    <svg className="h-16 w-16" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {forma === "gota" && (
        <>
          <path d="M32 12C36 22 46 26 46 36C46 43.732 39.732 50 32 50C24.268 50 18 43.732 18 36C18 26 28 22 32 12Z" fill="#FFFFFF" fillOpacity="0.85" {...trazo} />
          <path d="M32 22V44M26 32L32 37L38 30" {...trazo} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
      {forma === "ventana" && (
        <>
          <rect x="14" y="14" width="36" height="36" rx="6" fill="#FFFFFF" fillOpacity="0.85" {...trazo} />
          <line x1="32" y1="14" x2="32" y2="50" {...trazo} />
          <line x1="14" y1="32" x2="50" y2="32" {...trazo} />
        </>
      )}
      {forma === "estrella" && (
        <polygon points="32,12 37,26 52,26 40,35 44,50 32,41 20,50 24,35 12,26 27,26" fill="#FFFFFF" fillOpacity="0.85" {...trazo} />
      )}
      {forma === "cara" && (
        <>
          <circle cx="32" cy="32" r="16" fill="#FFFFFF" fillOpacity="0.85" {...trazo} />
          <path d="M24 34C27 38 37 38 40 34" {...trazo} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function DemoVitrina() {
  const t = useTranslations("landing.mod3");
  const [tag, setTag] = useState<string>("todas");
  const tags = ["acuarela", "luz-de-tarde", "collage"];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap gap-2">
        <Chip activo={tag === "todas"} onClick={() => setTag("todas")}>
          {t("tagAll")}
        </Chip>
        {tags.map((h) => (
          <Chip key={h} activo={tag === h} onClick={() => setTag(h)}>
            #{h}
          </Chip>
        ))}
      </div>
      <div className="columns-2 gap-3 space-y-3">
        {PIEZAS.filter((p) => tag === "todas" || p.tag === tag).map((p) => (
          <figure key={p.n} className="theme-surface-alt break-inside-avoid space-y-2 p-2.5">
            <div className={`${p.alto} ${p.fondo} flex items-center justify-center rounded-[var(--radius-inner)]`}>
              <Forma forma={p.forma} />
            </div>
            <figcaption className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
              <span>{t(`p${p.n}`)}</span>
              <span className="font-semibold text-[var(--text-primary)]">#{p.tag}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

const ALTURAS_INICIALES = [35, 70, 45, 90, 60, 85, 40, 75, 55, 95, 50, 65, 30, 80, 45, 60];

export function DemoAudio() {
  const t = useTranslations("landing");
  const [sonando, setSonando] = useState(false);
  const [alturas, setAlturas] = useState(ALTURAS_INICIALES);
  const contexto = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!sonando) return;
    const intervalo = window.setInterval(() => {
      setAlturas((prev) => prev.map(() => Math.floor(20 + Math.random() * 75)));
    }, 220);
    return () => window.clearInterval(intervalo);
  }, [sonando]);

  /** Un acorde suave (do–mi–sol) sintetizado: no hay archivo de audio. */
  function acorde() {
    try {
      contexto.current ??= new AudioContext();
      const ctx = contexto.current;
      const ahora = ctx.currentTime;
      [261.63, 329.63, 392.0].forEach((frecuencia, i) => {
        const inicio = ahora + i * 0.18;
        const osc = ctx.createOscillator();
        const volumen = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(frecuencia, inicio);
        volumen.gain.setValueAtTime(0.001, inicio);
        volumen.gain.exponentialRampToValueAtTime(0.035, inicio + 0.1);
        volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 1.4);
        osc.connect(volumen);
        volumen.connect(ctx.destination);
        osc.start(inicio);
        osc.stop(inicio + 1.5);
      });
    } catch {
      // Sin Web Audio: la onda se anima igual.
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="theme-surface-alt space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-literary text-base font-semibold text-[var(--text-primary)]">
              {t("mod4.trackTitle")}
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">{t("mod4.trackMeta")}</p>
          </div>
          <button
            type="button"
            aria-label={t("reproducir")}
            aria-pressed={sonando}
            onClick={() => {
              if (!sonando) acorde();
              setSonando((v) => !v);
            }}
            className="theme-btn-primary flex h-11 w-11 shrink-0 items-center justify-center text-sm font-bold"
          >
            {sonando ? "❚❚" : "▶"}
          </button>
        </div>
        <div
          aria-hidden="true"
          className="flex h-12 items-end justify-between gap-1 rounded-[var(--radius-inner)] border border-[var(--border-color)] bg-[var(--bg-surface)] px-2 py-2"
        >
          {alturas.map((alto, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-[var(--accent-primary)] transition-all duration-200"
              style={{ height: `${alto}%` }}
            />
          ))}
        </div>
        <p aria-live="polite" className="text-xs text-[var(--text-secondary)] italic">
          {sonando ? t("mod4.statusPlaying") : t("mod4.statusIdle")}
        </p>
      </div>
    </div>
  );
}

const ACENTOS = [
  { color: "#9BCFAE", clave: "verde" },
  { color: "#F0AEC4", clave: "rosa" },
  { color: "#74C7C3", clave: "turquesa" },
  { color: "#E02847", clave: "rojo" },
] as const;

export function Personalizador() {
  const t = useTranslations("landing");
  const { acento, setAcento, destellos, setDestellos } = useLanding();
  const [, alternarModo] = useAlternarModo();

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
      <div className="theme-surface-alt space-y-3 p-4">
        <h4 className="text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">
          {t("mod5.step1")}
        </h4>
        <BotonesTema variante="panel" />
      </div>

      <div className="theme-surface-alt space-y-3 p-4">
        <h4 className="text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">
          {t("mod5.step2")}
        </h4>
        <div className="flex items-center gap-3 pt-1">
          {ACENTOS.map(({ color, clave }) => (
            <button
              key={color}
              type="button"
              aria-label={t(`acentos.${clave}`)}
              aria-pressed={acento === color}
              onClick={() => setAcento(color)}
              className={`h-9 w-9 rounded-full border-2 border-[var(--text-primary)] shadow-sm transition-transform hover:scale-110 ${
                acento === color ? "ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-surface-alt)]" : ""
              }`}
              style={{ background: color }}
            />
          ))}
        </div>
        <p className="text-[11px] text-[var(--text-secondary)]">{t("mod5.step2Hint")}</p>
      </div>

      <div className="theme-surface-alt space-y-3 p-4">
        <h4 className="text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">
          {t("mod5.step3")}
        </h4>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={alternarModo}
            className="theme-btn-secondary flex items-center justify-between px-3 py-2 text-xs font-semibold"
          >
            <span>{t("mod5.modeBtn")}</span>
            <span aria-hidden="true">🌓</span>
          </button>
          <button
            type="button"
            aria-pressed={destellos}
            onClick={() => setDestellos(!destellos)}
            className="theme-btn-secondary flex items-center justify-between px-3 py-2 text-xs font-semibold"
          >
            <span>{destellos ? t("mod5.sparkleBtn") : t("mod5.sparkleBtnOff")}</span>
            <span aria-hidden="true">✨</span>
          </button>
        </div>
      </div>
    </div>
  );
}
