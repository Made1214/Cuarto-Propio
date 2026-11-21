"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { formatearDuracion } from "@/lib/audio/duracion";

/**
 * Reproductor de una nota, con los colores y el marco del tema.
 *
 * Reemplaza al `<audio controls>` nativo, que en cada navegador se veía
 * distinto (una píldora gris en Chrome, otra cosa en Safari), con un botón
 * de play diminuto y una barra de progreso que no se veía sobre los fondos
 * oscuros. Acá: un botón de 44 px que dice qué va a pasar (play o pausa), la
 * barra para saltar a cualquier punto (un `<input type="range">`, así sigue
 * funcionando con teclado y lector de pantalla) y el tiempo transcurrido
 * sobre el total.
 *
 * El total sale de la nota (`duracion`, medida al grabar): las grabaciones
 * WebM de MediaRecorder no traen la duración en sus metadatos y el
 * navegador informa `Infinity` hasta terminar de reproducirlas.
 *
 * Suena una nota a la vez: al darle play a una, las demás se pausan.
 */
const EVENTO = "cuarto-propio:audio-play";

export function Reproductor({ src, duracion }: { src: string; duracion: number | null }) {
  const t = useTranslations("audio");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [sonando, setSonando] = useState(false);
  const [actual, setActual] = useState(0);
  const [total, setTotal] = useState(duracion ?? 0);
  const [fallo, setFallo] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const otro = (evento: Event) => {
      if ((evento as CustomEvent<HTMLAudioElement>).detail !== audioRef.current) audioRef.current?.pause();
    };
    window.addEventListener(EVENTO, otro);
    return () => window.removeEventListener(EVENTO, otro);
  }, []);

  function alternar() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      window.dispatchEvent(new CustomEvent(EVENTO, { detail: audio }));
      setCargando(true);
      audio.play().catch(() => {
        setCargando(false);
        setFallo(true);
      });
    } else {
      audio.pause();
    }
  }

  if (fallo) {
    return (
      <p role="alert" className="border-(length:--borde) border-dashed border-ink/40 px-3 py-4 text-center apoyo text-xs">
        {t("noSePudoCargar")}
      </p>
    );
  }

  const progreso = total > 0 ? Math.min(100, (actual / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 border-(length:--borde) border-ink rounded-theme bg-background px-2 py-2">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setSonando(true)}
        onPlaying={() => setCargando(false)}
        onPause={() => {
          setSonando(false);
          setCargando(false);
        }}
        onEnded={() => {
          setSonando(false);
          setActual(0);
        }}
        onTimeUpdate={(evento) => setActual(evento.currentTarget.currentTime)}
        onLoadedMetadata={(evento) => {
          const d = evento.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setTotal(d);
        }}
        onError={() => setFallo(true)}
      />
      <button
        type="button"
        onClick={alternar}
        aria-label={sonando ? t("pausar") : t("reproducir")}
        title={sonando ? t("pausar") : t("reproducir")}
        className="boton boton-morado h-11 w-11 shrink-0 px-0"
      >
        {sonando ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <rect x="3" y="2" width="4" height="12" />
            <rect x="9" y="2" width="4" height="12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4 2l10 6-10 6z" />
          </svg>
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <input
          type="range"
          min={0}
          max={total || 1}
          step={0.1}
          value={Math.min(actual, total || 1)}
          onChange={(evento) => {
            const valor = Number(evento.target.value);
            if (audioRef.current) audioRef.current.currentTime = valor;
            setActual(valor);
          }}
          aria-label={t("posicion")}
          aria-valuetext={`${formatearDuracion(actual)} / ${formatearDuracion(total)}`}
          className="reproductor-barra w-full"
          style={{ "--progreso": `${progreso}%` } as React.CSSProperties}
        />
        <span className="flex justify-between text-xs tabular-nums text-muted/80">
          <span>{cargando ? t("cargandoAudio") : formatearDuracion(actual)}</span>
          <span>{total ? formatearDuracion(total) : "–:––"}</span>
        </span>
      </div>
    </div>
  );
}
