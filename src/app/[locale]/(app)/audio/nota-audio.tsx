"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { AvisoErrorAccion } from "@/components/aviso-error-accion";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { CategoriaSelector } from "@/components/categoria-selector";
import { clasificarErrorAccion, type ErrorAccion } from "@/lib/acciones/errores";
import { asignarCategoriaAudio, eliminarAudio, renombrarAudio } from "@/lib/audio/actions";
import { formatearDuracion } from "@/lib/audio/duracion";
import { TITULO_MAXIMO } from "@/lib/audio/limites";
import type { NotaAudioConUrl } from "@/lib/audio/types";
import type { Categoria } from "@/lib/categorias/types";
import { IconoEliminar } from "./iconos";

/**
 * Una nota de voz en el archivo: título editable en el momento, reproductor,
 * fecha y categoría. No tiene pantalla de detalle propia (a diferencia de la
 * Vitrina) porque acá no hay nada más que mostrar — la nota ES el audio, y
 * abrir una página aparte solo para escuchar sobraría.
 */
export function NotaAudio({
  nota,
  categorias,
}: {
  nota: NotaAudioConUrl;
  categorias: Categoria[];
}) {
  const t = useTranslations("audio");
  const format = useFormatter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<ErrorAccion | null>(null);
  const tituloRef = useRef<HTMLInputElement>(null);
  // El título que se VE mientras viaja el cambio. El campo no es
  // controlado (lo escrito ya está en pantalla); esto sirve para no mandar
  // dos veces el mismo título si se vuelve a salir del campo antes de que
  // responda el servidor. Al terminar, vuelve a mandar el real.
  const [titulo, setTituloOptimista] = useOptimistic(nota.titulo ?? "");

  function avisarError(fallo: unknown) {
    setError(clasificarErrorAccion(fallo));
  }

  const fecha = new Date(nota.fecha);
  // El título por defecto se arma al mostrar, no se guarda en la base: así
  // sale en el idioma de la interfaz en vez de quedar congelado en el que
  // estuviera activo el día que se grabó.
  const tituloPorDefecto = t("tituloPorDefecto", {
    fechaHora: format.dateTime(fecha, {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
  });

  return (
    <div className="tema-panel flex flex-col gap-3 border-(length:--borde) border-ink rounded-theme bg-card p-4 shadow-marco">
      <div className="flex items-center gap-1">
        <input
          ref={tituloRef}
          type="text"
          defaultValue={nota.titulo ?? ""}
          maxLength={TITULO_MAXIMO}
          // Vacío es un estado válido: vuelve al título por defecto, que es
          // justo lo que muestra el placeholder.
          placeholder={tituloPorDefecto}
          aria-label={t("campoTitulo")}
          onBlur={(evento) => {
            const valor = evento.target.value.trim();
            if (valor === titulo) return;
            const tituloReal = nota.titulo ?? "";
            setError(null);
            startTransition(async () => {
              setTituloOptimista(valor);
              try {
                await renombrarAudio(nota.id, valor);
              } catch (fallo) {
                // Lo escrito sigue en el campo aunque no se haya guardado:
                // se devuelve al título real para no mentir. El aviso va en
                // su propia transición para salir junto con esa vuelta.
                if (tituloRef.current) tituloRef.current.value = tituloReal;
                startTransition(() => avisarError(fallo));
              }
            });
          }}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") evento.currentTarget.blur();
          }}
          className="min-w-0 flex-1 border-b-(length:--borde) border-transparent bg-transparent py-0.5 font-diario text-lg font-semibold outline-none placeholder:text-muted/50 focus:border-ink"
        />

        {nota.duracionSegundos ? (
          <span className="shrink-0 px-1 font-pixel text-xs text-muted/70 tabular-nums">
            {formatearDuracion(nota.duracionSegundos)}
          </span>
        ) : null}

        <BotonConfirmar
          titulo={t("eliminar")}
          mensaje={t("eliminarConfirmar")}
          textoConfirmar={t("eliminar")}
          etiqueta={t("eliminar")}
          onConfirmar={() => {
            setError(null);
            startTransition(async () => {
              try {
                await eliminarAudio(nota.id);
              } catch (fallo) {
                startTransition(() => avisarError(fallo));
              }
            });
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center text-ink/35 transition-colors hover:bg-primary-pink/30 hover:text-ink"
        >
          <IconoEliminar />
        </BotonConfirmar>
      </div>

      <AvisoErrorAccion error={error} mensajeFallo={t("errorGuardar")} />

      {nota.url ? (
        // Reproductor nativo a propósito: trae por sí solo teclado, lectores
        // de pantalla y los controles del sistema en el celular. `metadata`
        // para que una página con muchas notas no se baje todos los audios
        // de golpe.
        <audio controls preload="metadata" src={nota.url} className="w-full">
          {t("sinReproductor")}
        </audio>
      ) : (
        <p className="border-(length:--borde) border-dashed border-ink/40 px-3 py-4 text-center font-pixel text-[10px] text-muted/60">
          {t("noSePudoCargar").toUpperCase()}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-pixel text-[10px] tracking-wide text-muted/70">
          {format.dateTime(fecha, { dateStyle: "long" }).toUpperCase()}
        </span>

        <div className="w-full max-w-56">
          <CategoriaSelector
            categoriaId={nota.categoriaId}
            categoriaNombre={nota.categoriaNombre}
            categorias={categorias}
            onElegir={(nombre) => asignarCategoriaAudio(nota.id, nombre)}
            onError={avisarError}
            textos={{
              cambiar: t("cambiarCategoria"),
              placeholder: t("categoriaPlaceholder"),
              quitar: t("quitarCategoria"),
              nueva: t("nuevaCategoriaPlaceholder"),
            }}
          />
        </div>
      </div>
    </div>
  );
}
