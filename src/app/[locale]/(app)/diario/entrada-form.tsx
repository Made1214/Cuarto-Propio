"use client";

import type { JSONContent } from "@tiptap/core";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { colorCategoria } from "@/lib/categorias/color";
import { useValidacionNativa } from "@/lib/formularios/validacion-nativa";
import { borrarBorrador, guardarBorrador, leerBorrador, type Borrador } from "@/lib/diario/borrador";
import type { Categoria, EntradaActionState } from "@/lib/diario/types";

const TITULO_MAXIMO = 100;

type EntradaFormProps = {
  formId: string;
  /** Identifica el borrador local: el código de la entrada, o "nueva". */
  claveBorrador: string;
  action: (estadoPrevio: EntradaActionState, formData: FormData) => Promise<EntradaActionState>;
  categorias: Categoria[];
  valoresIniciales?: {
    titulo?: string | null;
    categoriaNombre?: string | null;
    contenido?: JSONContent | null;
  };
};

/**
 * No renderiza su propio botón de guardar: la página dueña lo pone en su
 * fila de acciones (junto a Eliminar, cuando aplica) usando
 * `<button form={formId}>`, para que Guardar y Eliminar vivan juntos en
 * vez de quedar uno arriba y otro perdido al fondo del formulario.
 */
export function EntradaForm({
  formId,
  claveBorrador,
  action,
  categorias,
  valoresIniciales,
}: EntradaFormProps) {
  const t = useTranslations("diario");
  const format = useFormatter();
  const [estado, enviarAction] = useActionState(action, undefined);
  // El globo del título vacío dice lo mismo que el aviso de la Server
  // Action (que es la que atrapa el título hecho solo de espacios).
  const validacion = useValidacionNativa({
    titulo: {
      valueMissing: t("tituloRequerido"),
      tooLong: t("tituloDemasiadoLargo", { maximo: TITULO_MAXIMO }),
    },
  });

  const tituloInicial = valoresIniciales?.titulo ?? "";
  const categoriaInicial = valoresIniciales?.categoriaNombre ?? "";
  const contenidoInicial = valoresIniciales?.contenido ?? null;

  const [titulo, setTitulo] = useState(tituloInicial);
  const [categoriaTexto, setCategoriaTexto] = useState(categoriaInicial);
  const [contenido, setContenido] = useState<JSONContent | null>(contenidoInicial);

  // Remontar el editor es la forma simple de meterle contenido restaurado:
  // Tiptap toma `contenidoInicial` al crearse, no en cada render.
  const [contenidoBase, setContenidoBase] = useState(contenidoInicial);
  const [remonte, setRemonte] = useState(0);

  const [borrador, setBorrador] = useState<Borrador | null>(null);
  /** Cuándo se guardó por última vez el borrador local: se muestra para que
   * se vea que lo escrito no se pierde aunque se cierre el navegador. */
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);
  const enviando = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const sucio =
    titulo !== tituloInicial ||
    categoriaTexto !== categoriaInicial ||
    JSON.stringify(contenido) !== JSON.stringify(contenidoInicial);

  useEffect(() => {
    // Lectura única del almacenamiento del navegador al montar: es un
    // sistema externo, no estado derivado, y solo interesa la foto inicial
    // (lo que guardemos después es nuestro, no un borrador "encontrado").
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBorrador(leerBorrador(claveBorrador));
  }, [claveBorrador]);

  useEffect(() => {
    if (!sucio) return;
    const id = window.setTimeout(() => {
      guardarBorrador(claveBorrador, { titulo, categoria: categoriaTexto, contenido });
      setGuardadoEn(new Date());
    }, 600);
    return () => window.clearTimeout(id);
  }, [sucio, claveBorrador, titulo, categoriaTexto, contenido]);

  useEffect(() => {
    if (!sucio) return;
    const avisar = (evento: BeforeUnloadEvent) => {
      if (enviando.current) return;
      evento.preventDefault();
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sucio]);

  useEffect(() => {
    if (estado?.error) errorRef.current?.focus();
  }, [estado]);

  function restaurar() {
    if (!borrador) return;
    setTitulo(borrador.titulo);
    setCategoriaTexto(borrador.categoria);
    setContenido(borrador.contenido);
    setContenidoBase(borrador.contenido);
    setRemonte((valor) => valor + 1);
    setBorrador(null);
  }

  function descartar() {
    borrarBorrador(claveBorrador);
    setBorrador(null);
  }

  return (
    <form
      id={formId}
      action={enviarAction}
      {...validacion}
      onSubmit={() => {
        enviando.current = true;
        borrarBorrador(claveBorrador);
      }}
      className="flex flex-col gap-4"
    >
      {estado?.error ? (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="border-(length:--borde) border-ink-strong rounded-theme bg-primary-pink px-3 py-2 font-pixel text-xs tracking-wide text-ink-strong outline-none"
        >
          {estado.error}
        </p>
      ) : null}

      {borrador ? (
        <div className="flex flex-wrap items-center gap-3 border-(length:--borde) border-dashed border-ink rounded-theme bg-secondary-turquoise/15 px-3 py-2">
          <p className="flex-1 text-sm">
            {t("borradorEncontrado", {
              fecha: format.dateTime(new Date(borrador.guardadoEn), {
                dateStyle: "short",
                timeStyle: "short",
              }),
              hace: format.relativeTime(new Date(borrador.guardadoEn)),
            })}
          </p>
          <button
            type="button"
            onClick={restaurar}
            className="flex h-10 items-center border-(length:--borde) border-ink rounded-theme bg-primary-green px-3 text-[13px] font-semibold text-ink-strong transition-[filter] hover:brightness-95"
          >
            {t("restaurarBorrador")}
          </button>
          <button
            type="button"
            onClick={descartar}
            className="flex h-10 items-center border-(length:--borde) border-ink rounded-theme bg-card px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-primary-pink/30"
          >
            {t("descartarBorrador")}
          </button>
        </div>
      ) : null}

      {guardadoEn && sucio ? (
        <p aria-live="polite" className="-mb-1 flex items-center gap-1.5 text-xs text-muted/75">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12l5 5L20 6" />
          </svg>
          {t("borradorGuardado", {
            hora: format.dateTime(guardadoEn, { hour: "numeric", minute: "2-digit" }),
          })}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-titulo`} className="text-xs font-semibold">
          {t("campoTitulo")} <span aria-hidden="true" className="text-secondary-purple">*</span>
        </label>
        <input
          id={`${formId}-titulo`}
          type="text"
          name="titulo"
          required
          maxLength={TITULO_MAXIMO}
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          placeholder={t("tituloPlaceholder")}
          className="rounded-theme border-(length:--borde) border-ink bg-card px-3 py-2.5 font-diario text-2xl font-semibold outline-none"
        />
        {titulo.length > TITULO_MAXIMO - 20 ? (
          <span className="self-end font-pixel text-xs text-muted/70 tabular-nums">
            {titulo.length}/{TITULO_MAXIMO}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="text"
          name="categoria"
          value={categoriaTexto}
          onChange={(evento) => setCategoriaTexto(evento.target.value)}
          placeholder={t("categoriaPlaceholder")}
          className="w-64 max-w-full rounded-theme border-(length:--borde) border-ink bg-card px-3 py-2 text-sm outline-none"
        />
        {categorias.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {categorias.map((cat) => {
              const seleccionada = cat.nombre === categoriaTexto;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaTexto(seleccionada ? "" : cat.nombre)}
                  aria-pressed={seleccionada}
                  className={`flex items-center gap-1.5 border-(length:--borde) px-2.5 py-1 font-pixel text-xs tracking-wide transition-colors ${
                    seleccionada ? "border-ink-strong bg-secondary-purple/10" : "border-ink/30 hover:border-ink-strong"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 border border-ink-strong"
                    style={{ background: colorCategoria(categorias, cat.id) }}
                  />
                  {cat.nombre.toUpperCase()}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <TiptapEditor
        key={remonte}
        name="contenido"
        contenidoInicial={contenidoBase}
        onCambio={setContenido}
      />
    </form>
  );
}
