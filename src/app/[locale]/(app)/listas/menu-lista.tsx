"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { IconoCasilla, IconoEliminar } from "./iconos";

/**
 * Las acciones de una lista, con nombre, detrás de un "⋯": mostrar casillas,
 * cambiarle el nombre y eliminarla. Antes las casillas eran un cuadradito
 * gris sin texto al lado del nombre (en el celular no hay tooltip, así que
 * no había forma de saber qué hacía) y "Eliminar lista" quedaba suelto al
 * pie de cada tarjeta.
 */
export function MenuLista({
  nombreLista,
  conCasillas,
  onCasillas,
  onRenombrar,
  onEliminar,
}: {
  nombreLista: string;
  conCasillas: boolean;
  onCasillas: (valor: boolean) => void;
  onRenombrar: () => void;
  onEliminar: () => void;
}) {
  const t = useTranslations("listas");
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Se cierra al tocar fuera o con Escape. La ventanita de confirmar
  // eliminar vive dentro del contenedor, así que tocarla no lo cierra.
  useEffect(() => {
    if (!abierto) return;
    function fuera(evento: PointerEvent) {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const claseOpcion =
    "flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm font-medium text-ink transition-colors hover:bg-secondary-purple/15";

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-controls={menuId}
        aria-label={t("opcionesLista", { nombre: nombreLista })}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-theme text-ink/70 transition-colors hover:bg-secondary-purple/15 hover:text-ink aria-expanded:bg-secondary-purple/20 aria-expanded:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {abierto ? (
        <div
          id={menuId}
          className="absolute top-full right-0 z-20 mt-1 flex w-60 flex-col border-(length:--borde) border-ink rounded-theme bg-card py-1 shadow-marco"
        >
          <button
            type="button"
            role="switch"
            aria-checked={conCasillas}
            onClick={() => onCasillas(!conCasillas)}
            className={claseOpcion}
          >
            <IconoCasilla activa={conCasillas} />
            <span className="flex-1">{t("mostrarCasillas")}</span>
            <span className="text-xs font-semibold text-secondary-purple">
              {conCasillas ? t("si") : t("no")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              onRenombrar();
            }}
            className={claseOpcion}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16z" />
            </svg>
            {t("cambiarNombre")}
          </button>
          <div className="my-1 border-t-(length:--borde) border-ink/15" />
          <BotonConfirmar
            titulo={t("eliminar")}
            mensaje={t("eliminarConfirmar")}
            textoConfirmar={t("eliminar")}
            etiqueta={t("eliminarLista")}
            onConfirmar={onEliminar}
            className={claseOpcion}
          >
            <IconoEliminar />
            <span>{t("eliminarLista")}</span>
          </BotonConfirmar>
        </div>
      ) : null}
    </div>
  );
}
