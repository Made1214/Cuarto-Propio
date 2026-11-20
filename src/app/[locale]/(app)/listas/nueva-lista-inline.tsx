"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AvisoErrorAccion } from "@/components/aviso-error-accion";
import { clasificarErrorAccion, type ErrorAccion } from "@/lib/acciones/errores";
import { crearLista } from "@/lib/listas/actions";
import { IconoEliminar } from "./iconos";

/** Vive en el encabezado, no en el tablero: crear una lista es una acción de
 * la página, y como tarjeta ocupaba un lugar de la cuadrícula. El mismo
 * botón va dentro del estado vacío, donde es el siguiente paso obvio. */
export function NuevaListaInline() {
  const t = useTranslations("listas");
  const [activo, setActivo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [conCasillas, setConCasillas] = useState(false);
  const [pendiente, startTransition] = useTransition();
  // Lo que haya que decirle: que falta el nombre, o que no se pudo guardar.
  const [aviso, setAviso] = useState<"nombreVacio" | ErrorAccion | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const avisoId = useId();

  function cerrar() {
    setNombre("");
    setConCasillas(false);
    setAviso(null);
    setActivo(false);
  }

  if (!activo) {
    return (
      <button
        type="button"
        onClick={() => setActivo(true)}
        className="boton boton-rosa"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {t("nuevaLista")}
      </button>
    );
  }

  function enviar() {
    const nombreLimpio = nombre.trim();
    // Sin nombre no se guarda, pero tampoco se cierra en silencio: antes el
    // formulario desaparecía y no quedaba claro si la lista se había creado.
    // Se queda abierto, con el aviso y el cursor de vuelta en el campo.
    if (!nombreLimpio) {
      setAviso("nombreVacio");
      campoRef.current?.focus();
      return;
    }
    setAviso(null);
    startTransition(async () => {
      try {
        await crearLista(nombreLimpio, "", conCasillas);
      } catch (fallo) {
        // El formulario sigue abierto con lo escrito, listo para reintentar.
        startTransition(() => setAviso(clasificarErrorAccion(fallo)));
        return;
      }
      // La action ya trae la página con la lista nueva; cerrar dentro de la
      // transición hace que el formulario se vaya en el mismo cuadro en que
      // aparece la tarjeta (un set después del await queda fuera si no).
      startTransition(() => cerrar());
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-(length:--borde) border-ink rounded-theme bg-card p-2 shadow-marco">
      <input
        ref={campoRef}
        type="text"
        autoFocus
        required
        aria-label={t("nombrePlaceholder")}
        aria-invalid={aviso === "nombreVacio"}
        aria-describedby={aviso === "nombreVacio" ? avisoId : undefined}
        value={nombre}
        onChange={(evento) => {
          setNombre(evento.target.value);
          if (aviso === "nombreVacio") setAviso(null);
        }}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            evento.preventDefault();
            enviar();
          }
          if (evento.key === "Escape") cerrar();
        }}
        disabled={pendiente}
        placeholder={t("nombrePlaceholder")}
        className="min-w-0 flex-1 basis-48 border-(length:--borde) border-ink rounded-theme bg-background px-2.5 py-1.5 text-sm outline-none"
      />

      <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm">
        <input
          type="checkbox"
          checked={conCasillas}
          onChange={(evento) => setConCasillas(evento.target.checked)}
          disabled={pendiente}
          className="h-4 w-4 shrink-0 cursor-pointer border-(length:--borde) border-ink rounded-theme accent-secondary-purple"
        />
        {t("listaConCasillas")}
      </label>

      <button
        type="button"
        onClick={enviar}
        disabled={pendiente}
        className="boton boton-verde boton-chico"
      >
        {t("guardar")}
      </button>
      <button
        type="button"
        onClick={cerrar}
        aria-label={t("cancelar")}
        title={t("cancelar")}
        className="flex h-8 w-8 items-center justify-center text-muted/70 transition-colors hover:bg-primary-pink/30 hover:text-ink"
      >
        <IconoEliminar />
      </button>

      {aviso === "nombreVacio" ? (
        <p
          id={avisoId}
          role="alert"
          className="basis-full border-(length:--borde) border-ink rounded-theme bg-primary-pink px-3 py-2 text-xs text-ink-strong"
        >
          {t("nombreRequerido")}
        </p>
      ) : aviso ? (
        <div className="basis-full">
          <AvisoErrorAccion error={aviso} mensajeFallo={t("errorGuardar")} />
        </div>
      ) : null}
    </div>
  );
}
