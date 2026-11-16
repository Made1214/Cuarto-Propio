"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { IconoSeccion } from "./icono-seccion";
import { IconoCerrar, IconoEscribir, IconoMas } from "./iconos-secciones";

/**
 * Las cuatro cosas que se pueden crear, en el orden de la ventanita (y de
 * las teclas 1–4). Exhibir y Grabar llevan a su sección y no directo al
 * selector de archivos o al micrófono: el navegador solo abre esos dos con
 * un toque de la usuaria en esa misma pantalla, no desde otra ruta.
 */
const OPCIONES = [
  { clave: "escribir", href: "/diario/nueva", ruta: null, fondo: "bg-primary-pink" },
  { clave: "exhibir", href: "/vitrina", ruta: "/vitrina", fondo: "bg-secondary-turquoise" },
  { clave: "grabar", href: "/audio", ruta: "/audio", fondo: "bg-primary-green" },
  { clave: "nuevaLista", href: "/listas", ruta: "/listas", fondo: "bg-card" },
] as const;

/**
 * El botón "Crear" y su ventanita: un solo lugar desde el que empezar
 * cualquier cosa, sin tener que saber antes en qué sección vive.
 *
 * Dos variantes del disparador: el botón verde de la barra de arriba
 * (escritorio) y el botón central levantado de la barra de abajo (celular).
 * La ventanita es la misma; en el celular sube desde abajo como una hoja, en
 * escritorio se abre al centro (ver `.hoja-crear` en globals.css).
 */
export function MenuCrear({ variante }: { variante: "barra" | "inferior" }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <>
      {variante === "barra" ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-haspopup="dialog"
          aria-expanded={abierto}
          className="tema-crear flex h-10 items-center gap-1.5 border-(length:--borde) border-ink rounded-theme bg-primary-green px-4 text-sm font-bold text-ink-strong shadow-marco-sm transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <IconoMas tamano={18} />
          {t("crear")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-haspopup="dialog"
          aria-expanded={abierto}
          className="flex flex-col items-center gap-1 text-xs font-semibold text-ink"
        >
          <span className="-mt-7 flex h-13 w-13 items-center justify-center border-(length:--borde-grueso) border-ink rounded-theme bg-primary-green text-ink-strong shadow-marco-sm transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            <IconoMas tamano={26} />
          </span>
          {t("crear")}
        </button>
      )}

      <dialog
        ref={ref}
        aria-labelledby={`crear-titulo-${variante}`}
        onClose={() => setAbierto(false)}
        onClick={(evento) => {
          if (evento.target === ref.current) setAbierto(false);
        }}
        onKeyDown={(evento) => {
          // Atajo de escritorio: 1–4 eligen la opción sin tocar el mouse.
          const indice = Number(evento.key) - 1;
          const opcion = OPCIONES[indice];
          if (!opcion || evento.metaKey || evento.ctrlKey || evento.altKey) return;
          evento.preventDefault();
          setAbierto(false);
          router.push(opcion.href);
        }}
        className="hoja-crear m-0 mt-auto w-full max-w-none border-0 bg-transparent p-0 text-foreground backdrop:bg-velo md:m-auto md:w-[44rem]"
      >
        <div className="flex flex-col gap-5 border-t-(length:--borde-grueso) border-ink bg-background px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:border-(length:--borde-grueso) md:px-8 md:py-7 md:shadow-marco-lg">
          <span aria-hidden="true" className="mx-auto h-1.5 w-11 bg-ink/30 md:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id={`crear-titulo-${variante}`}
                className="font-diario text-2xl font-bold text-secondary-purple md:text-3xl"
              >
                {t("crearTitulo")}
              </h2>
              <p className="mt-1 text-sm text-muted/75">
                {t("crearAyuda")}
                <span className="hidden md:inline"> {t("crearAyudaTeclas")}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label={t("cerrar")}
              className="flex h-11 w-11 shrink-0 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-card text-ink transition-colors hover:bg-primary-pink/40"
            >
              <IconoCerrar tamano={18} />
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {OPCIONES.map(({ clave, href, ruta, fondo }, indice) => (
              <li key={clave}>
                <Link
                  href={href}
                  onClick={() => setAbierto(false)}
                  className={`flex h-full min-h-32 flex-col gap-2.5 border-(length:--borde) border-ink rounded-theme p-4 shadow-marco transition-[transform,filter] hover:brightness-95 active:translate-x-1 active:translate-y-1 active:shadow-none ${fondo} ${
                    fondo === "bg-card" ? "text-foreground" : "text-ink-strong"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-card text-ink">
                    {ruta ? <IconoSeccion ruta={ruta} tamano={22} /> : <IconoEscribir tamano={22} />}
                  </span>
                  <span className="text-base font-bold">{t(clave)}</span>
                  <span className="text-[13px] leading-snug">{t(`${clave}Ayuda`)}</span>
                  <span aria-hidden="true" className="mt-auto hidden font-pixel text-[11px] md:block">
                    {indice + 1}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
