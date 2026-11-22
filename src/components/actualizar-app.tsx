"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

/** Desde cuánto tiempo en segundo plano vale la pena preguntar por datos y
 * versión nuevos al volver (un vistazo a otra app no). */
const AUSENCIA_MINIMA_MS = 30_000;
/** Cuánto hay que tirar hacia abajo (en px de dedo) para recargar. */
const UMBRAL_TIRON = 140;

function esAppInstalada() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari de iOS, para la app agregada a la pantalla de inicio.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Dos arreglos para la PWA instalada, que no tiene barra de direcciones ni
 * botón de recargar:
 *
 * 1. Al volver a la app después de un rato, se fija si hubo un deploy
 *    (`/api/version` contra la versión de este código). Si lo hubo, recarga:
 *    iOS retoma la app con el código viejo en memoria y, sin esto, seguía
 *    mostrando pantallas de antes y llamando a actions que ya no existen. Si
 *    no lo hubo, refresca los datos de la pantalla, por si cambiaron en otro
 *    dispositivo.
 * 2. Tirar hacia abajo desde arriba de todo recarga, como en el navegador.
 *    El rebote de iOS se apaga en globals.css (con él, la barra de arriba se
 *    despegaba y bajaba con el contenido); este gesto lo reemplaza.
 */
export function ActualizarApp() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [tiron, setTiron] = useState(0);
  const [recargando, setRecargando] = useState(false);
  const ocultaDesde = useRef<number | null>(null);

  useEffect(() => {
    async function alVolver() {
      const desde = ocultaDesde.current;
      ocultaDesde.current = null;
      if (desde === null || Date.now() - desde < AUSENCIA_MINIMA_MS) return;
      try {
        const respuesta = await fetch("/api/version", { cache: "no-store" });
        const { version } = (await respuesta.json()) as { version?: string };
        if (version && version !== process.env.VERSION_APP) {
          window.location.reload();
          return;
        }
      } catch {
        // Sin conexión: se queda con lo que hay, sin romper nada.
        return;
      }
      router.refresh();
    }

    function alCambiarVisibilidad() {
      if (document.visibilityState === "hidden") ocultaDesde.current = Date.now();
      else void alVolver();
    }

    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => document.removeEventListener("visibilitychange", alCambiarVisibilidad);
  }, [router]);

  useEffect(() => {
    if (!esAppInstalada()) return;
    let inicio: number | null = null;
    let distancia = 0;

    function alTocar(evento: TouchEvent) {
      inicio = null;
      if (window.scrollY > 0 || evento.touches.length !== 1) return;
      // Ni con una ventanita abierta ni dentro de algo que tiene su propio
      // scroll y no está arriba de todo (el panel de perfil, por ejemplo).
      if (document.querySelector("dialog[open]")) return;
      for (let nodo = evento.target as Element | null; nodo; nodo = nodo.parentElement) {
        if (nodo.scrollTop > 0) return;
      }
      inicio = evento.touches[0].clientY;
      distancia = 0;
    }

    function alMover(evento: TouchEvent) {
      if (inicio === null) return;
      distancia = Math.max(0, evento.touches[0].clientY - inicio);
      setTiron(distancia);
    }

    function alSoltar() {
      if (inicio === null) return;
      inicio = null;
      if (distancia >= UMBRAL_TIRON) {
        setRecargando(true);
        window.location.reload();
        return;
      }
      setTiron(0);
    }

    window.addEventListener("touchstart", alTocar, { passive: true });
    window.addEventListener("touchmove", alMover, { passive: true });
    window.addEventListener("touchend", alSoltar);
    window.addEventListener("touchcancel", alSoltar);
    return () => {
      window.removeEventListener("touchstart", alTocar);
      window.removeEventListener("touchmove", alMover);
      window.removeEventListener("touchend", alSoltar);
      window.removeEventListener("touchcancel", alSoltar);
    };
  }, []);

  if (tiron < 24 && !recargando) return null;
  const listo = recargando || tiron >= UMBRAL_TIRON;
  // Baja con el dedo, a la mitad de su recorrido y sin pasarse.
  const desplazamiento = Math.min(tiron, UMBRAL_TIRON) / 2;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
      style={{ top: `calc(env(safe-area-inset-top) + 3.5rem + ${desplazamiento}px)` }}
    >
      <span className="flex items-center gap-2 border-(length:--borde) border-ink rounded-theme bg-card px-3 py-1.5 text-sm font-semibold text-ink shadow-marco-sm">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={recargando ? "motion-safe:animate-spin" : undefined}
          style={recargando ? undefined : { transform: `rotate(${listo ? 180 : 0}deg)`, transition: "transform 150ms" }}
        >
          {recargando ? <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /> : <path d="M12 5v14M6 13l6 6 6-6" />}
        </svg>
        {recargando ? t("recargando") : listo ? t("soltarParaRecargar") : t("tirarParaRecargar")}
      </span>
    </div>
  );
}
