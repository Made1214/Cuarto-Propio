"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatearDuracion } from "@/lib/audio/duracion";
import { DURACION_MAXIMA_SEGUNDOS, TAMANO_MAXIMO_BYTES } from "@/lib/audio/limites";
import { IconoCerrar, IconoDetener, IconoMicrofono, IconoReintentar } from "./iconos";

type CodigoError = "permiso" | "soporte" | "formato" | "tamano" | "sesion" | "fallo";

/** Lo que el navegador prefiera de esta lista: Opus donde se pueda (pesa
 * ~1MB por minuto, que es lo que hace que el tope de 10 minutos alcance sin
 * un paso de compresión aparte) y MP4/AAC en Safari, que no graba WebM. */
const TIPOS_PREFERIDOS = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function tipoPreferido(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return TIPOS_PREFERIDOS.find((tipo) => MediaRecorder.isTypeSupported(tipo));
}

/** Se pregunta al tocar "Grabar" y no antes: en el render no se puede (el
 * servidor diría siempre que no y la hidratación no coincidiría), y en un
 * efecto sería un setState en cascada para un caso rarísimo — Safari viejo,
 * la app servida sin HTTPS, o el micrófono bloqueado por política del
 * navegador. */
function puedeGrabar(): boolean {
  return (
    typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

/**
 * Grabadora de notas de voz. Graba en el navegador con MediaRecorder (ya sale
 * comprimida de ahí, no hace falta un segundo paso como en las fotos), corta
 * sola a los 10 minutos y sube la nota apenas se detiene.
 *
 * Si la subida falla, la grabación NO se descarta: queda en memoria con su
 * botón de reintentar, que es lo que pide CLAUDE.md → Confiabilidad. Perder
 * un audio ya grabado por un corte de internet sería lo peor que puede pasar
 * en esta pantalla.
 */
export function Grabador({ variante = "boton" }: { variante?: "boton" | "panel" }) {
  const t = useTranslations("audio");
  const router = useRouter();

  const [estado, setEstado] = useState<"inactivo" | "grabando" | "subiendo">("inactivo");
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<CodigoError | null>(null);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);
  /** Grabación lista pero sin subir (falló el intento anterior). */
  const [pendiente, setPendiente] = useState<{ blob: Blob; duracion: number } | null>(null);

  const grabadoraRef = useRef<MediaRecorder | null>(null);
  const trozosRef = useRef<Blob[]>([]);
  const inicioRef = useRef(0);
  const relojRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function soltarMicrofono() {
    if (relojRef.current) {
      clearInterval(relojRef.current);
      relojRef.current = null;
    }
    // Sin esto el indicador de "grabando" del navegador se queda prendido
    // aunque la nota ya esté guardada.
    grabadoraRef.current?.stream.getTracks().forEach((pista) => pista.stop());
    grabadoraRef.current = null;
  }

  useEffect(() => soltarMicrofono, []);

  function textoError(codigo: CodigoError) {
    if (codigo === "permiso") return t("errorPermiso");
    if (codigo === "soporte") return t("errorSoporte");
    if (codigo === "formato") return t("errorFormato");
    if (codigo === "tamano") return t("errorTamano");
    if (codigo === "sesion") return t("errorSesion");
    return t("errorFallo");
  }

  async function subir(blob: Blob, duracion: number) {
    setEstado("subiendo");
    setError(null);

    if (blob.size > TAMANO_MAXIMO_BYTES) {
      setPendiente({ blob, duracion });
      setError("tamano");
      setEstado("inactivo");
      return;
    }

    try {
      const cuerpo = new FormData();
      cuerpo.append("archivo", blob, "nota-de-voz");
      cuerpo.append("duracion", String(duracion));
      const respuesta = await fetch("/api/audio", { method: "POST", body: cuerpo });

      if (!respuesta.ok) {
        const datos = (await respuesta.json().catch(() => ({}))) as { error?: CodigoError };
        setPendiente({ blob, duracion });
        setError(datos.error ?? "fallo");
        setEstado("inactivo");
        return;
      }

      setPendiente(null);
      setSegundos(0);
      setEstado("inactivo");
      router.refresh();
    } catch {
      setPendiente({ blob, duracion });
      setError("fallo");
      setEstado("inactivo");
    }
  }

  function detener() {
    if (grabadoraRef.current?.state === "recording") {
      grabadoraRef.current.stop();
    }
  }

  async function grabar() {
    setError(null);
    setLimiteAlcanzado(false);
    setPendiente(null);

    if (!puedeGrabar()) {
      setError("soporte");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Un "no" al permiso y un micrófono que no existe llegan igual desde
      // el navegador, así que se explican juntos.
      setError("permiso");
      return;
    }

    const tipo = tipoPreferido();
    const grabadora = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
    grabadoraRef.current = grabadora;
    trozosRef.current = [];

    grabadora.ondataavailable = (evento) => {
      if (evento.data.size > 0) trozosRef.current.push(evento.data);
    };

    grabadora.onstop = () => {
      const duracion = Math.round((Date.now() - inicioRef.current) / 1000);
      const blob = new Blob(trozosRef.current, { type: grabadora.mimeType || "audio/webm" });
      trozosRef.current = [];
      soltarMicrofono();
      // Un toque accidental (menos de un segundo) no deja una nota vacía en
      // el archivo: se descarta sin avisar nada.
      if (blob.size === 0 || duracion < 1) {
        setEstado("inactivo");
        setSegundos(0);
        return;
      }
      void subir(blob, duracion);
    };

    inicioRef.current = Date.now();
    setSegundos(0);
    setEstado("grabando");
    grabadora.start();

    relojRef.current = setInterval(() => {
      const transcurridos = (Date.now() - inicioRef.current) / 1000;
      setSegundos(Math.floor(transcurridos));
      if (transcurridos >= DURACION_MAXIMA_SEGUNDOS) {
        // Se corta sola y se guarda lo grabado hasta acá, avisando por qué
        // (criterio de aceptación del límite de 10 minutos).
        setLimiteAlcanzado(true);
        detener();
      }
    }, 250);
  }

  const restantes = DURACION_MAXIMA_SEGUNDOS - segundos;

  return (
    <div className="flex flex-col items-stretch gap-3">
      {estado === "grabando" ? (
        <button
          type="button"
          onClick={detener}
          className={`flex items-center justify-center gap-2 border-2 border-ink bg-primary-pink font-pixel tracking-wide text-ink-strong shadow-[4px_4px_0_var(--ink)] transition-[transform,filter] hover:brightness-95 active:translate-x-1 active:translate-y-1 active:shadow-none ${
            variante === "panel" ? "px-5 py-3 text-xs" : "px-4 py-2.5 text-xs"
          }`}
        >
          <IconoDetener />
          {t("detener").toUpperCase()}
          <span aria-live="polite" className="tabular-nums">
            {formatearDuracion(segundos)}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void grabar()}
          disabled={estado === "subiendo"}
          className={`flex items-center justify-center gap-2 border-2 border-ink bg-primary-green font-pixel tracking-wide text-ink-strong shadow-[4px_4px_0_var(--ink)] transition-[transform,filter] hover:brightness-95 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 ${
            variante === "panel" ? "px-5 py-3 text-xs" : "px-4 py-2.5 text-xs"
          }`}
        >
          <IconoMicrofono />
          {(estado === "subiendo" ? t("subiendo") : t("grabar")).toUpperCase()}
        </button>
      )}

      {estado === "grabando" ? (
        <div className="flex flex-col gap-1.5 border-2 border-ink bg-card p-2 shadow-[4px_4px_0_var(--ink)]">
          <div className="flex items-center justify-between gap-3 font-pixel text-[10px] tracking-wide">
            <span className="flex items-center gap-1.5 text-ink">
              <span className="h-2.5 w-2.5 animate-pulse bg-primary-pink" aria-hidden="true" />
              {t("grabando").toUpperCase()}
            </span>
            <span className="text-muted/70 tabular-nums">
              {t("restante", { tiempo: formatearDuracion(Math.max(0, restantes)) })}
            </span>
          </div>
          {/* Barra de tiempo: a los 10 minutos llega al final y la grabación
              se corta sola, así que conviene verla venir. */}
          <div className="h-1.5 w-full border-2 border-ink/30">
            <div
              className="h-full bg-primary-pink transition-[width]"
              style={{ width: `${Math.min(100, (segundos / DURACION_MAXIMA_SEGUNDOS) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      {limiteAlcanzado && !error ? (
        <p className="border-2 border-ink-strong bg-secondary-turquoise px-3 py-2 text-xs text-ink-strong">
          {t("limiteAlcanzado", { minutos: Math.round(DURACION_MAXIMA_SEGUNDOS / 60) })}
        </p>
      ) : null}

      {error ? (
        <div className="flex flex-wrap items-center gap-2 border-2 border-ink-strong bg-primary-pink px-3 py-2 text-ink-strong">
          <span className="min-w-0 flex-1 text-xs">{textoError(error)}</span>

          {/* La grabación sigue en memoria: se puede reintentar sin volver a
              hablar. Un formato que el servidor no acepta es la excepción —
              reintentarlo daría exactamente el mismo resultado. */}
          {pendiente && error !== "formato" ? (
            <button
              type="button"
              onClick={() => void subir(pendiente.blob, pendiente.duracion)}
              disabled={estado === "subiendo"}
              className="flex items-center gap-1.5 border-2 border-ink-strong bg-background px-2.5 py-1 font-pixel text-[10px] tracking-wide text-ink transition-colors hover:bg-secondary-purple/10 disabled:opacity-60"
            >
              <IconoReintentar />
              {t("reintentar").toUpperCase()}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setError(null);
              setPendiente(null);
            }}
            aria-label={t("descartar")}
            title={t("descartar")}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-ink-strong/60 transition-colors hover:text-ink-strong"
          >
            <IconoCerrar />
          </button>
        </div>
      ) : null}
    </div>
  );
}
