"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { AvisoErrorAccion } from "@/components/aviso-error-accion";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { CategoriaSelector } from "@/components/categoria-selector";
import { clasificarErrorAccion, type ErrorAccion } from "@/lib/acciones/errores";
import { asignarCategoriaAudio, eliminarAudio, renombrarAudio } from "@/lib/audio/actions";
import { Reproductor } from "./reproductor";
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
  const tituloRef = useRef<HTMLTextAreaElement>(null);

  // El título crece en renglones en vez de cortarse: en el celular, al lado
  // del tacho, un título de tres palabras ya no entraba.
  useEffect(() => {
    const campo = tituloRef.current;
    if (!campo) return;
    const ajustar = () => {
      campo.style.height = "auto";
      campo.style.height = `${campo.scrollHeight}px`;
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(campo);
    return () => observador.disconnect();
  }, []);
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
      <div className="flex items-start gap-1">
        <textarea
          ref={tituloRef}
          rows={1}
          onInput={(evento) => {
            evento.currentTarget.style.height = "auto";
            evento.currentTarget.style.height = `${evento.currentTarget.scrollHeight}px`;
          }}
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
            if (evento.key === "Enter") {
              evento.preventDefault();
              evento.currentTarget.blur();
            }
          }}
          className="min-w-0 flex-1 resize-none overflow-hidden border-b-(length:--borde) border-transparent bg-transparent py-0.5 font-diario text-lg leading-snug font-semibold outline-none placeholder:text-muted/50 focus:border-ink pointer-coarse:py-1.5"
        />


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
          className="flex h-9 w-9 shrink-0 items-center justify-center text-ink/45 transition-colors hover:bg-primary-pink/30 hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
        >
          <IconoEliminar />
        </BotonConfirmar>
      </div>

      <AvisoErrorAccion error={error} mensajeFallo={t("errorGuardar")} />

      {nota.url ? (
        <Reproductor src={nota.url} duracion={nota.duracionSegundos ?? null} />
      ) : (
        <p className="border-(length:--borde) border-dashed border-ink/40 px-3 py-4 text-center apoyo text-xs">
          {t("noSePudoCargar")}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="apoyo text-xs">
          {format.dateTime(fecha, { dateStyle: "long" })}
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
