"use client";

import { useEffect } from "react";

/**
 * Mientras `activo`, pide que la pantalla no se apague (Screen Wake Lock).
 * En el celular, si la pantalla se apaga a mitad de una nota, el navegador
 * suspende la página y el micrófono se corta.
 *
 * El navegador suelta el bloqueo solo cuando la pestaña deja de verse; al
 * volver se pide de nuevo. Donde no hay Wake Lock (Safari viejo, Firefox de
 * escritorio) no hace nada: se graba igual, como antes.
 */
export function usePantallaEncendida(activo: boolean) {
  useEffect(() => {
    if (!activo || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let bloqueo: WakeLockSentinel | null = null;
    let vigente = true;

    async function pedir() {
      try {
        const nuevo = await navigator.wakeLock.request("screen");
        if (vigente) bloqueo = nuevo;
        else void nuevo.release();
      } catch {
        // Sin permiso o sin batería suficiente: se graba igual.
      }
    }

    function alVolver() {
      if (document.visibilityState === "visible" && (!bloqueo || bloqueo.released)) void pedir();
    }

    void pedir();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      vigente = false;
      document.removeEventListener("visibilitychange", alVolver);
      void bloqueo?.release().catch(() => {});
    };
  }, [activo]);
}

/** Mientras `activo`, el navegador pregunta antes de cerrar o recargar la
 * pestaña (el texto lo pone el navegador, no se puede elegir). */
export function useAvisoAntesDeSalir(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    function avisar(evento: BeforeUnloadEvent) {
      evento.preventDefault();
      // Algunos navegadores todavía piden `returnValue` para mostrar el aviso.
      evento.returnValue = "";
    }
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [activo]);
}
