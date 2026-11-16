"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VentanaDialogo } from "@/components/ventana-dialogo";

/** Reemplaza el `window.prompt` del enlace: en el celular ese cuadro nativo
 * es incómodo de pegar y no se puede leer lo que ya había. */
export function DialogoEnlace({
  abierto,
  urlActual,
  onCerrar,
  onGuardar,
  onQuitar,
}: {
  abierto: boolean;
  urlActual: string;
  onCerrar: () => void;
  onGuardar: (url: string) => void;
  onQuitar: () => void;
}) {
  const t = useTranslations("editor");
  const tDialogos = useTranslations("dialogos");
  const [url, setUrl] = useState(urlActual);

  // Al reabrir, el campo arranca con el enlace que tenga la selección.
  const [urlPrevia, setUrlPrevia] = useState(urlActual);
  if (urlPrevia !== urlActual) {
    setUrlPrevia(urlActual);
    setUrl(urlActual);
  }

  function guardar() {
    const limpia = url.trim();
    if (!limpia) return;
    onGuardar(limpia);
  }

  return (
    <VentanaDialogo
      abierto={abierto}
      titulo={t("enlace")}
      onCerrar={onCerrar}
      etiquetaCerrar={tDialogos("cerrar")}
      acciones={
        <>
          {urlActual ? (
            <button
              type="button"
              onClick={onQuitar}
              className="mr-auto border-(length:--borde) border-ink rounded-theme bg-card px-4 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-primary-pink/30"
            >
              {t("quitarEnlace").toUpperCase()}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCerrar}
            className="border-(length:--borde) border-ink rounded-theme bg-card px-4 py-2 font-pixel text-xs tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
          >
            {tDialogos("cancelar").toUpperCase()}
          </button>
          <button
            type="button"
            onClick={guardar}
            className="border-(length:--borde) border-ink rounded-theme bg-primary-green px-4 py-2 font-pixel text-xs tracking-wide text-ink-strong shadow-marco-sm transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {tDialogos("guardar").toUpperCase()}
          </button>
        </>
      }
    >
      <label className="flex flex-col gap-2">
        <span className="font-pixel text-xs tracking-wide text-muted/70">{t("enlaceUrl")}</span>
        <input
          type="url"
          autoFocus
          inputMode="url"
          value={url}
          onChange={(evento) => setUrl(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") {
              evento.preventDefault();
              guardar();
            }
          }}
          placeholder="https://"
          className="rounded-theme border-(length:--borde) border-ink bg-background px-3 py-2 text-sm outline-none"
        />
      </label>
    </VentanaDialogo>
  );
}
