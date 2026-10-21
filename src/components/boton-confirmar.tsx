"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VentanaDialogo } from "@/components/ventana-dialogo";

/**
 * Botón que pide confirmación en una ventanita propia en vez de
 * `window.confirm`. El navegador decide cómo se ve un confirm nativo —y
 * cómo lo escribe—, así que todo borrado de la app quedaba fuera del tema.
 */
export function BotonConfirmar({
  titulo,
  mensaje,
  textoConfirmar,
  onConfirmar,
  children,
  className,
  etiqueta,
}: {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  onConfirmar: () => void;
  children: React.ReactNode;
  className?: string;
  etiqueta: string;
}) {
  const t = useTranslations("dialogos");
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={etiqueta}
        title={etiqueta}
        className={className}
      >
        {children}
      </button>

      <VentanaDialogo
        abierto={abierto}
        titulo={titulo}
        onCerrar={() => setAbierto(false)}
        etiquetaCerrar={t("cerrar")}
        acciones={
          <>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="border-2 border-ink bg-card px-4 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
            >
              {t("cancelar").toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                onConfirmar();
              }}
              className="border-2 border-ink bg-primary-pink px-4 py-2 font-pixel text-xs tracking-wide text-ink-strong shadow-[3px_3px_0_var(--ink)] transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              {textoConfirmar.toUpperCase()}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          {/* Señal de peligro en píxeles: el color solo no alcanza para
              decir "esto no se deshace". */}
          <svg width="28" height="28" viewBox="0 0 12 12" aria-hidden="true" className="mt-0.5 shrink-0">
            <rect x="5" y="0" width="2" height="2" fill="var(--primary-pink)" />
            <rect x="4" y="2" width="4" height="2" fill="var(--primary-pink)" />
            <rect x="3" y="4" width="6" height="2" fill="var(--primary-pink)" />
            <rect x="2" y="6" width="8" height="2" fill="var(--primary-pink)" />
            <rect x="1" y="8" width="10" height="2" fill="var(--primary-pink)" />
            <rect x="0" y="10" width="12" height="2" fill="var(--primary-pink)" />
            <rect x="5" y="4" width="2" height="4" fill="var(--ink-strong)" />
            <rect x="5" y="9" width="2" height="2" fill="var(--ink-strong)" />
          </svg>
          <p className="text-sm leading-relaxed">{mensaje}</p>
        </div>
      </VentanaDialogo>
    </>
  );
}
