"use client";

import { useEffect, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { marcarBienvenidaVista } from "@/lib/perfil/actions";
import {
  IconoAudio,
  IconoDiario,
  IconoListas,
  IconoVitrina,
} from "./iconos-secciones";

/**
 * El mensaje de bienvenida del primer inicio de sesión (CLAUDE.md →
 * Usabilidad): una sola ventanita que cuenta qué hay en el cuarto y dónde se
 * empieza. Nada de tour de varios pasos. Al cerrarla —con el botón, con
 * Escape o tocando afuera— queda marcada como vista en la cuenta.
 */
export function Bienvenida() {
  const t = useTranslations("bienvenida");
  const ref = useRef<HTMLDialogElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const dialogo = ref.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
  }, []);

  function alCerrar() {
    // Si falla el guardado, la peor consecuencia es verla otra vez la
    // próxima: no vale la pena interrumpir con un error.
    startTransition(async () => {
      try {
        await marcarBienvenidaVista();
      } catch (fallo) {
        console.error("No se pudo marcar la bienvenida como vista", fallo);
      }
    });
  }

  const modulos = [
    { clave: "diario", Icono: IconoDiario, fondo: "bg-primary-pink" },
    { clave: "listas", Icono: IconoListas, fondo: "bg-card" },
    { clave: "vitrina", Icono: IconoVitrina, fondo: "bg-secondary-turquoise" },
    { clave: "audio", Icono: IconoAudio, fondo: "bg-primary-green" },
  ] as const;

  return (
    <dialog
      ref={ref}
      aria-labelledby="bienvenida-titulo"
      onClose={alCerrar}
      onClick={(evento) => {
        if (evento.target === ref.current) ref.current?.close();
      }}
      className="ventana-dialogo m-auto w-[min(32rem,calc(100vw-2rem))] max-w-none border-0 bg-transparent p-0 text-foreground backdrop:bg-velo"
    >
      <div className="border-[3px] border-ink bg-background shadow-[8px_8px_0_var(--ink)]">
        <div className="border-b-[3px] border-ink bg-secondary-purple px-4 py-2.5 font-pixel text-xs tracking-wide text-background">
          {t("barra")}
        </div>
        <div className="flex flex-col gap-5 p-6">
          <div>
            <h2
              id="bienvenida-titulo"
              className="font-diario text-2xl font-bold text-secondary-purple"
            >
              {t("titulo")}
            </h2>
            <p className="mt-2 font-diario text-base leading-relaxed">
              {t("texto")}
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2.5">
            {modulos.map(({ clave, Icono, fondo }) => (
              <li
                key={clave}
                className={`flex items-center gap-2.5 border-2 border-ink p-3 text-sm font-semibold ${fondo} ${
                  fondo === "bg-card" ? "text-ink" : "text-ink-strong"
                }`}
              >
                <Icono tamano={20} />
                {t(clave)}
              </li>
            ))}
          </ul>
          <p className="text-sm leading-snug text-muted/85">{t("consejo")}</p>
          <form method="dialog">
            <button
              type="submit"
              autoFocus
              className="flex h-12 w-full items-center justify-center border-2 border-ink bg-primary-green text-[15px] font-bold text-ink-strong shadow-[4px_4px_0_var(--ink)] transition-[transform,filter] hover:brightness-95 active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {t("empezar")}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
