"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import type { Categoria } from "@/lib/categorias/types";
import { actualizarImagen } from "@/lib/imagenes/actions";
import { useValidacionNativa } from "@/lib/formularios/validacion-nativa";
import { formatearHashtags, normalizarHashtags } from "@/lib/imagenes/hashtags";
import { DESCRIPCION_MAXIMA, TITULO_MAXIMO } from "@/lib/imagenes/limites";
import type { ImagenConVersionCompleta } from "@/lib/imagenes/types";

/**
 * Formulario de una pieza. Vive en su propia pantalla (no en la ficha) para
 * que mirar y editar sean dos cosas distintas. Al guardar, la Server Action
 * redirige de vuelta a la ficha — igual que en el Diario.
 *
 * Las etiquetas visibles se reemplazan por `placeholder` + `aria-label`: la
 * misma información para un lector de pantalla, sin tres renglones de
 * cartelería encima de cada campo.
 */
export function FormularioImagen({
  locale,
  imagen,
  categorias,
  acciones,
}: {
  locale: string;
  imagen: ImagenConVersionCompleta;
  categorias: Categoria[];
  /** Botón de eliminar: lo arma la página porque necesita la Server Action
   * atada a esta pieza. */
  acciones: React.ReactNode;
}) {
  const t = useTranslations("vitrina");
  const [estado, enviarAction, enviando] = useActionState(
    actualizarImagen.bind(null, locale, imagen.id),
    undefined,
  );
  // Con `maxLength` el navegador casi nunca deja pasarse, pero si un texto ya
  // venía más largo y se edita sin recortarlo, levanta su globo: que diga lo
  // mismo que la Server Action, y en el idioma de la interfaz.
  const validacion = useValidacionNativa({
    titulo: { tooLong: t("tituloDemasiadoLargo", { maximo: TITULO_MAXIMO }) },
    descripcion: { tooLong: t("descripcionDemasiadoLarga", { maximo: DESCRIPCION_MAXIMA }) },
  });

  const [titulo, setTitulo] = useState(imagen.titulo ?? "");
  const [descripcion, setDescripcion] = useState(imagen.descripcion ?? "");
  const [hashtagsTexto, setHashtagsTexto] = useState(formatearHashtags(imagen.hashtags));
  const [categoriaTexto, setCategoriaTexto] = useState(imagen.categoriaNombre ?? "");
  const [eligiendoCategoria, setEligiendoCategoria] = useState(false);

  // Los hashtags se muestran ya normalizados mientras se escriben: así se ve
  // de antemano que "#Viajes, #viajes" es una sola etiqueta y que los
  // símbolos raros se caen solos, en vez de descubrirlo después de guardar.
  const etiquetas = normalizarHashtags(hashtagsTexto);
  const categoriaElegida = categorias.find((cat) => cat.nombre === categoriaTexto) ?? null;

  return (
    <form action={enviarAction} {...validacion} className="flex flex-col gap-4 p-4">
      {estado?.error ? (
        <p className="border-(length:--borde) border-ink-strong rounded-theme bg-primary-pink px-3 py-2 text-[13px] font-semibold text-ink-strong">
          {estado.error}
        </p>
      ) : null}

      <input
        type="text"
        name="titulo"
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        maxLength={TITULO_MAXIMO}
        aria-label={t("campoTitulo")}
        placeholder={t("tituloPlaceholder")}
        className="border-(length:--borde) border-ink rounded-theme bg-background px-3 py-2 font-diario text-2xl font-bold text-secondary-purple outline-none placeholder:font-normal placeholder:text-muted/40"
      />

      <textarea
        name="descripcion"
        rows={4}
        value={descripcion}
        onChange={(evento) => setDescripcion(evento.target.value)}
        maxLength={DESCRIPCION_MAXIMA}
        aria-label={t("campoDescripcion")}
        placeholder={t("descripcionPlaceholder")}
        className="resize-y border-(length:--borde) border-ink rounded-theme bg-background px-3 py-2 text-sm outline-none placeholder:text-muted/40"
      />

      <div className="flex flex-col gap-1.5">
        <input
          type="text"
          name="hashtags"
          value={hashtagsTexto}
          onChange={(evento) => setHashtagsTexto(evento.target.value)}
          aria-label={t("campoHashtags")}
          placeholder={t("hashtagsPlaceholder")}
          className="border-(length:--borde) border-ink rounded-theme bg-background px-3 py-2 text-sm text-secondary-purple outline-none placeholder:text-muted/40"
        />
        {etiquetas.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {etiquetas.map((etiqueta) => (
              <span
                key={etiqueta}
                className="border-(length:--borde) border-ink-strong rounded-theme bg-secondary-turquoise px-2.5 py-1 text-[13px] font-semibold text-ink-strong"
              >
                #{etiqueta}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted/60">{t("hashtagsAyuda")}</p>
        )}
      </div>

      {/* La categoría se despliega solo si se toca: es un dato más de la
          pieza, no merece una lista de chips siempre abierta. */}
      <input type="hidden" name="categoria" value={categoriaTexto} />
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setEligiendoCategoria((valor) => !valor)}
          aria-expanded={eligiendoCategoria}
          aria-label={t("campoCategoria")}
          className="flex w-fit max-w-full items-center gap-1.5 border-(length:--borde) px-2.5 py-1 text-[13px] font-semibold"
          style={
            categoriaElegida
              ? {
                  borderColor: "var(--ink-strong)",
                  background: colorCategoria(categorias, categoriaElegida.id),
                  color: "var(--ink-strong)",
                }
              : { borderColor: "var(--ink)", borderStyle: "dashed", opacity: 0.7 }
          }
        >
          <span className="truncate">
            {categoriaTexto || t("categoriaPlaceholder")}
          </span>
        </button>

        {eligiendoCategoria ? (
          <div className="flex flex-col gap-2 border-(length:--borde) border-ink rounded-theme bg-background p-2">
            <div className="flex flex-wrap gap-1">
              {categoriaTexto ? (
                <button
                  type="button"
                  onClick={() => setCategoriaTexto("")}
                  className="border-(length:--borde) border-dashed border-ink rounded-theme px-2.5 py-1 text-[13px] font-semibold text-ink hover:bg-secondary-purple/10"
                >
                  {t("categoriaPlaceholder")}
                </button>
              ) : null}
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoriaTexto(cat.nombre);
                    setEligiendoCategoria(false);
                  }}
                  className="border-(length:--borde) border-transparent px-2.5 py-1 text-[13px] font-semibold text-ink-strong hover:border-ink-strong"
                  style={{ background: colorCategoria(categorias, cat.id) }}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={categoriaTexto}
              onChange={(evento) => setCategoriaTexto(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === "Enter") {
                  evento.preventDefault();
                  setEligiendoCategoria(false);
                }
                if (evento.key === "Escape") setEligiendoCategoria(false);
              }}
              placeholder={t("nuevaCategoriaPlaceholder")}
              className="border-(length:--borde) border-ink rounded-theme bg-card px-2 py-1 text-sm outline-none"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t-(length:--borde) border-ink/20 pt-3">
        <button
          type="submit"
          disabled={enviando}
          className="border-(length:--borde) border-ink rounded-theme bg-primary-green h-11 px-4 text-sm font-semibold flex items-center text-ink-strong transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-60"
        >
          {enviando ? t("guardando") : t("guardar")}
        </button>
        <Link
          href={`/vitrina/${imagen.codigo}`}
          className="border-(length:--borde) border-ink rounded-theme bg-card h-11 px-4 text-sm font-semibold flex items-center text-ink transition-colors hover:bg-secondary-purple/10"
        >
          {t("cancelar")}
        </Link>
        <span className="ml-auto">{acciones}</span>
      </div>
    </form>
  );
}
