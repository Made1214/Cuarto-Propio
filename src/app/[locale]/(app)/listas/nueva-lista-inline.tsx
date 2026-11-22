"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AvisoErrorAccion } from "@/components/aviso-error-accion";
import { clasificarErrorAccion, type ErrorAccion } from "@/lib/acciones/errores";
import { crearLista } from "@/lib/listas/actions";
import { useAccionPrincipal } from "@/lib/accion-principal";

/** Vive en el encabezado, no en el tablero: crear una lista es una acción de
 * la página, y como tarjeta ocupaba un lugar de la cuadrícula. El mismo
 * botón va dentro del estado vacío, donde es el siguiente paso obvio. */
export function NuevaListaInline({ principal = false }: { principal?: boolean }) {
  const t = useTranslations("listas");
  const [activo, setActivo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [conCasillas, setConCasillas] = useState(false);
  const [pendiente, startTransition] = useTransition();
  // Lo que haya que decirle: que falta el nombre, o que no se pudo guardar.
  const [aviso, setAviso] = useState<"nombreVacio" | ErrorAccion | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const avisoId = useId();
  // El del encabezado se abre también desde el botón del centro de la barra
  // de abajo; en el celular su propio botón se esconde.
  useAccionPrincipal("listas", () => setActivo(true), principal);

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
        className={`boton boton-rosa ${principal ? "max-md:hidden" : ""}`}
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

  // Abierto ocupa todo el ancho (debajo del título de la sección) y se ve
  // como una ventanita propia, con su barra: antes era una tira apretada al
  // lado del título que se confundía con las tarjetas de abajo.
  return (
    <div className="nueva-lista-abierta flex w-full flex-col overflow-hidden border-(length:--borde) border-ink rounded-theme bg-card shadow-marco">
      <p className="border-b-(length:--borde) border-ink bg-secondary-purple px-3 py-1.5 text-sm font-semibold text-background">
        {t("nuevaLista")}
      </p>
      <div className="flex flex-col gap-3 p-3 sm:p-4">
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
        className="h-11 w-full shrink-0 border-(length:--borde) border-ink rounded-theme bg-background px-3 font-diario text-base font-semibold outline-none focus:border-secondary-purple"
      />

      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 self-start text-sm">
        <input
          type="checkbox"
          checked={conCasillas}
          onChange={(evento) => setConCasillas(evento.target.checked)}
          disabled={pendiente}
          className="h-5 w-5 shrink-0 cursor-pointer border-(length:--borde) border-ink rounded-theme accent-secondary-purple"
        />
        {t("listaConCasillas")}
      </label>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={cerrar} className="boton">
          {t("cancelar")}
        </button>
        <button
          type="button"
          onClick={enviar}
          disabled={pendiente}
          aria-busy={pendiente}
          className="boton boton-verde"
        >
          {t("crear")}
        </button>
      </div>
      {aviso === "nombreVacio" ? (
        <p
          id={avisoId}
          role="alert"
          className="border-(length:--borde) border-ink rounded-theme bg-primary-pink px-3 py-2 text-xs text-ink-strong"
        >
          {t("nombreRequerido")}
        </p>
      ) : aviso ? (
        <div>
          <AvisoErrorAccion error={aviso} mensajeFallo={t("errorGuardar")} />
        </div>
      ) : null}
      </div>
    </div>
  );
}
