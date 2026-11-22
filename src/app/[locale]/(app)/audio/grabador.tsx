"use client";

import { useEffect, useRef, useState } from "react";
import { useAccionPrincipal } from "@/lib/accion-principal";
import { useAvisoAntesDeSalir, usePantallaEncendida } from "@/lib/audio/pantalla-encendida";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatearDuracion } from "@/lib/audio/duracion";
import {
  BITRATE_AUDIO_BPS,
  DURACION_MAXIMA_SEGUNDOS,
  TAMANO_MAXIMO_BYTES,
} from "@/lib/audio/limites";
import { IconoAudio as IconoMicrofono } from "@/components/iconos-secciones";
import { IconoCerrar, IconoReintentar } from "./iconos";

type CodigoError = "permiso" | "soporte" | "formato" | "tamano" | "espacio" | "sesion" | "fallo";

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
 * Grabadora de notas de voz. Graba en el navegador con MediaRecorder a un
 * bitrate de voz (ya sale comprimida de ahí, no hace falta un segundo paso
 * como en las fotos), corta sola a los 10 minutos y sube la nota apenas se
 * detiene.
 *
 * Si la subida falla, la grabación NO se descarta: queda en memoria con su
 * botón de reintentar, que es lo que pide CLAUDE.md → Confiabilidad. Perder
 * un audio ya grabado por un corte de internet sería lo peor que puede pasar
 * en esta pantalla.
 */
export function Grabador() {
  const t = useTranslations("audio");
  const router = useRouter();

  const [estado, setEstado] = useState<"inactivo" | "grabando" | "subiendo">("inactivo");
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<CodigoError | null>(null);
  const [guardada, setGuardada] = useState(false);
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
    if (codigo === "espacio") return t("errorEspacio");
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
      // Confirmación visible unos segundos: antes la nota aparecía en la
      // lista sin decir nada, y no quedaba claro si se había guardado.
      setGuardada(true);
      window.setTimeout(() => setGuardada(false), 4000);
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
    setGuardada(false);
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
    // El bitrate bajo es lo que hace que 10 minutos quepan en el límite de
    // subida de Vercel (ver limites.ts); el formato sigue siendo el preferido.
    const grabadora = new MediaRecorder(stream, {
      ...(tipo ? { mimeType: tipo } : {}),
      audioBitsPerSecond: BITRATE_AUDIO_BPS,
    });
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

  const grabando = estado === "grabando";
  // Grabando, la pantalla no se apaga (si se apaga, el celular corta el
  // micrófono). Y mientras hay algo sin guardar —grabando, subiendo o una
  // grabación que falló al subir— cerrar la pestaña pregunta antes.
  usePantallaEncendida(grabando);
  useAvisoAntesDeSalir(estado !== "inactivo" || pendiente !== null);
  // El botón del centro de la barra de abajo graba (y, grabando, detiene)
  // igual que el botón redondo: queda al alcance del pulgar.
  useAccionPrincipal("audio", () => {
    if (estado === "subiendo") return;
    if (grabando) detener();
    else void grabar();
  });

  return (
    <div className="flex flex-col items-stretch gap-3">
      {/* Un botón redondo grande (el único elemento redondo de la app: se
          reconoce como "grabar" sin leer nada) y al lado, qué va a pasar. */}
      <section
        aria-label={t("grabadora")}
        className="tema-panel flex items-center gap-4 border-(length:--borde) border-ink rounded-theme bg-card p-4 shadow-marco sm:gap-5 sm:p-5"
      >
        <button
          type="button"
          onClick={grabando ? detener : () => void grabar()}
          disabled={estado === "subiendo"}
          aria-label={grabando ? t("detener") : t("grabar")}
          // Grabando cambia de color y late un anillo alrededor: se nota de
          // reojo que el micrófono está abierto.
          className={`relative flex h-19 w-19 shrink-0 items-center justify-center rounded-full border-(length:--borde-grueso) border-ink text-ink-strong shadow-marco-sm transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-60 sm:h-22 sm:w-22 ${
            grabando
              ? "bg-secondary-turquoise after:absolute after:-inset-2 after:rounded-full after:border-2 after:border-primary-pink after:motion-safe:animate-ping"
              : "bg-primary-pink"
          }`}
        >
          {grabando ? (
            <span aria-hidden="true" className="h-6 w-6 bg-ink-strong" />
          ) : (
            <IconoMicrofono tamano={32} />
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {grabando ? (
            <>
              <span className="flex items-center gap-2 text-[17px] font-bold">
                <span aria-hidden="true" className="h-2.5 w-2.5 animate-pulse rounded-full border border-ink-strong bg-primary-pink" />
                {t("grabando")} ·{" "}
                <span aria-live="polite" className="tabular-nums">
                  {formatearDuracion(segundos)}
                </span>
              </span>
              <span className="text-[13px] text-muted/80">
                {t("restante", { tiempo: formatearDuracion(Math.max(0, restantes)) })} · {t("tocaParaDetener")}
              </span>
              {/* Barra de tiempo: a los 10 minutos llega al final y la
                  grabación se corta sola, así que conviene verla venir. */}
              <div className="mt-1 h-2.5 w-full border-(length:--borde) border-ink rounded-theme bg-background">
                <div
                  className="h-full bg-primary-pink transition-[width]"
                  style={{ width: `${Math.min(100, (segundos / DURACION_MAXIMA_SEGUNDOS) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <span aria-live="polite" className="text-[17px] font-bold">
                {estado === "subiendo" ? t("subiendo") : guardada ? t("guardada") : t("tocaParaGrabar")}
              </span>
              <span className="text-[13px] leading-snug text-muted/80">
                {t("ayudaGrabar", { minutos: Math.round(DURACION_MAXIMA_SEGUNDOS / 60) })}
              </span>
            </>
          )}
        </div>
      </section>

      {limiteAlcanzado && !error ? (
        <p className="border-(length:--borde) border-ink-strong rounded-theme bg-secondary-turquoise px-3 py-2 text-sm text-ink-strong">
          {t("limiteAlcanzado", { minutos: Math.round(DURACION_MAXIMA_SEGUNDOS / 60) })}
        </p>
      ) : null}

      {error ? (
        <div className="flex flex-wrap items-center gap-2 border-(length:--borde) border-ink-strong rounded-theme bg-primary-pink px-3 py-2 text-ink-strong">
          <span className="min-w-0 flex-1 text-sm">{textoError(error)}</span>

          {/* La grabación sigue en memoria: se puede reintentar sin volver a
              hablar. Un formato que el servidor no acepta es la excepción —
              reintentarlo daría exactamente el mismo resultado. */}
          {pendiente && error !== "formato" ? (
            <button
              type="button"
              onClick={() => void subir(pendiente.blob, pendiente.duracion)}
              disabled={estado === "subiendo"}
              className="boton boton-chico"
            >
              <IconoReintentar />
              {t("reintentar")}
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
            className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-strong/60 transition-colors hover:text-ink-strong"
          >
            <IconoCerrar />
          </button>
        </div>
      ) : null}
    </div>
  );
}
