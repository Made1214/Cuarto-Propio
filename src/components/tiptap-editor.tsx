"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { useTranslations } from "next-intl";
import { useReducer, useRef, useState } from "react";
import { DialogoEnlace } from "@/components/dialogo-enlace";
import {
  IconoCita,
  IconoCursiva,
  IconoEnlace,
  IconoImagen,
  IconoLista,
  IconoListaNumerada,
  IconoNegrita,
  IconoQuitar,
  IconoTachado,
  IconoTitulo,
} from "@/components/editor-iconos";
import {
  FORMATOS_ACEPTADOS,
  TAMANO_MAXIMO_BYTES,
  TAMANO_MAXIMO_ORIGINAL_BYTES,
} from "@/lib/imagenes/limites";
import { reducirImagen } from "@/lib/imagenes/reducir";
import { tiptapExtensions } from "@/lib/tiptap-extensions";

type ErrorImagen = "formato" | "tamano" | "sesion" | "fallo";

/** Lo que devuelve `/api/diario/imagen` al subir. */
type ImagenSubida = { src: string; completa: string; ancho: number; alto: number };

const CONTENIDO_VACIO: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
const COLOR_TEXTO_DEFECTO = "#171717";
const COLOR_RESALTADO_DEFECTO = "#fde68a";

type TiptapEditorProps = {
  name: string;
  contenidoInicial?: JSONContent | null;
  /** Para que el formulario pueda guardar un borrador de lo que se escribe. */
  onCambio?: (json: JSONContent) => void;
};

export function TiptapEditor({ name, contenidoInicial, onCambio }: TiptapEditorProps) {
  const [json, setJson] = useState<JSONContent>(contenidoInicial ?? CONTENIDO_VACIO);
  // Fuerza un re-render en CADA transacción, no solo cuando cambia el
  // contenido o la selección. Sin esto, marcar negrita/cursiva con el
  // cursor vacío (sin texto todavía) queda guardado como "formato
  // pendiente" dentro de Tiptap, pero la barra no se enteraba —no cambia
  // el documento ni la selección— así que el botón no se veía marcado
  // hasta escribir. onTransaction dispara con cualquier cambio de estado,
  // incluido ese.
  const [, avisarSeleccion] = useReducer((tick: number) => tick + 1, 0);
  // Pegar o soltar una foto en el texto la sube igual que el botón. El
  // editor se crea una sola vez, así que mira la función por una ref.
  const subirRef = useRef<(archivo: File) => void>(() => {});

  const editor = useEditor({
    extensions: tiptapExtensions,
    content: contenidoInicial ?? CONTENIDO_VACIO,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      setJson(json);
      onCambio?.(json);
    },
    onTransaction: () => avisarSeleccion(),
    editorProps: {
      handlePaste: (_vista, evento) => {
        const archivo = [...(evento.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
        if (!archivo) return false;
        subirRef.current(archivo);
        return true;
      },
      handleDrop: (_vista, evento) => {
        const archivo = [...((evento as DragEvent).dataTransfer?.files ?? [])].find((f) =>
          f.type.startsWith("image/"),
        );
        if (!archivo) return false;
        evento.preventDefault();
        subirRef.current(archivo);
        return true;
      },
      attributes: {
        class: "diario-prose prose max-w-none min-h-[240px] focus:outline-none",
      },
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Barra editor={editor} subirRef={subirRef} />
      <div className="rounded-theme border-(length:--borde) border-ink bg-card px-4 py-3">
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={JSON.stringify(json)} />
    </div>
  );
}

function Barra({
  editor,
  subirRef,
}: {
  editor: Editor | null;
  subirRef: React.RefObject<(archivo: File) => void>;
}) {
  const t = useTranslations("editor");
  const [enlaceAbierto, setEnlaceAbierto] = useState(false);
  const archivoRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorImagen, setErrorImagen] = useState<ErrorImagen | null>(null);
  /** La foto que falló, para reintentar sin volver a elegirla
   * (CLAUDE.md → Confiabilidad: reintentar sin perder el resto). */
  const [pendiente, setPendiente] = useState<File | null>(null);

  /**
   * Sube la foto por el pipeline único (miniatura + completa con sharp) y la
   * inserta donde está el cursor. Lo escrito no se toca si algo falla: queda
   * el aviso con "Reintentar".
   */
  async function subir(archivo: File) {
    if (!editor) return;
    setErrorImagen(null);
    if (archivo.size > TAMANO_MAXIMO_ORIGINAL_BYTES) {
      setPendiente(null);
      setErrorImagen("tamano");
      return;
    }
    setSubiendo(true);
    // Se reduce en el navegador antes de subir (Vercel corta las peticiones
    // de más de 4,5 MB). El tope se mira sobre lo reducido, que es lo que
    // viaja; y si hay que reintentar, se reintenta con esto, sin reducir de
    // nuevo.
    const reducido = await reducirImagen(archivo);
    if (reducido.size > TAMANO_MAXIMO_BYTES) {
      setSubiendo(false);
      setPendiente(null);
      setErrorImagen("tamano");
      return;
    }
    try {
      const cuerpo = new FormData();
      cuerpo.append("archivo", reducido);
      const respuesta = await fetch("/api/diario/imagen", { method: "POST", body: cuerpo });
      if (!respuesta.ok) {
        const datos = (await respuesta.json().catch(() => ({}))) as { error?: ErrorImagen };
        const codigo = datos.error ?? "fallo";
        setPendiente(codigo === "formato" ? null : reducido);
        setErrorImagen(codigo);
        return;
      }
      const imagen = (await respuesta.json()) as ImagenSubida;
      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: { src: imagen.src, completa: imagen.completa, ancho: imagen.ancho, alto: imagen.alto },
        })
        .run();
      setPendiente(null);
    } catch {
      setPendiente(reducido);
      setErrorImagen("fallo");
    } finally {
      setSubiendo(false);
    }
  }
  // Para pegar y soltar (ver `TiptapEditor`).
  // eslint-disable-next-line react-hooks/refs
  subirRef.current = (archivo) => void subir(archivo);

  if (!editor) return null;

  const botones: {
    clave: string;
    icono: React.ReactNode;
    titulo: string;
    activo: boolean;
    accion: () => void;
  }[] = [
    {
      clave: "negrita",
      icono: <IconoNegrita />,
      titulo: t("negrita"),
      activo: editor.isActive("bold"),
      accion: () => editor.chain().focus().toggleBold().run(),
    },
    {
      clave: "cursiva",
      icono: <IconoCursiva />,
      titulo: t("cursiva"),
      activo: editor.isActive("italic"),
      accion: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      clave: "tachado",
      icono: <IconoTachado />,
      titulo: t("tachado"),
      activo: editor.isActive("strike"),
      accion: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      clave: "titulo",
      icono: <IconoTitulo nivel={2} />,
      titulo: t("titulo"),
      activo: editor.isActive("heading", { level: 2 }),
      accion: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      clave: "subtitulo",
      icono: <IconoTitulo nivel={3} />,
      titulo: t("subtitulo"),
      activo: editor.isActive("heading", { level: 3 }),
      accion: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      clave: "lista",
      icono: <IconoLista />,
      titulo: t("lista"),
      activo: editor.isActive("bulletList"),
      accion: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      clave: "listaNumerada",
      icono: <IconoListaNumerada />,
      titulo: t("listaNumerada"),
      activo: editor.isActive("orderedList"),
      accion: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      clave: "cita",
      icono: <IconoCita />,
      titulo: t("cita"),
      activo: editor.isActive("blockquote"),
      accion: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  const colorTexto = (editor.getAttributes("textStyle").color as string | undefined) ?? COLOR_TEXTO_DEFECTO;
  const colorResaltado = (editor.getAttributes("highlight").color as string | undefined) ?? COLOR_RESALTADO_DEFECTO;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {botones.map((boton) => (
        <button
          key={boton.clave}
          type="button"
          title={boton.titulo}
          aria-label={boton.titulo}
          onMouseDown={(evento) => {
            // preventDefault evita que el botón le quite el foco al editor
            // antes de aplicar el formato — sin esto, encadenar dos formatos
            // (ej. negrita + cursiva) desde el cursor, antes de escribir,
            // se rompía porque el editor perdía y recuperaba el foco entre
            // click y click.
            evento.preventDefault();
            boton.accion();
          }}
          aria-pressed={boton.activo}
          className={`flex h-8 min-w-8 items-center justify-center rounded-theme border-(length:--borde) border-ink px-2 transition-colors ${
            boton.activo
              ? "bg-secondary-purple text-background"
              : "bg-card text-ink hover:bg-secondary-turquoise/25"
          }`}
        >
          {boton.icono}
        </button>
      ))}
      <button
        type="button"
        title={t("enlace")}
        aria-label={t("enlace")}
        onMouseDown={(evento) => {
          evento.preventDefault();
          setEnlaceAbierto(true);
        }}
        aria-pressed={editor.isActive("link")}
        className={`flex h-8 min-w-8 items-center justify-center rounded-theme border-(length:--borde) border-ink px-2 transition-colors ${
          editor.isActive("link")
            ? "bg-secondary-purple text-background"
            : "bg-card text-ink hover:bg-secondary-turquoise/25"
        }`}
      >
        <IconoEnlace />
      </button>

      <button
        type="button"
        title={t("imagen")}
        onMouseDown={(evento) => evento.preventDefault()}
        onClick={() => archivoRef.current?.click()}
        disabled={subiendo}
        className="flex h-8 items-center gap-1.5 rounded-theme border-(length:--borde) border-ink bg-secondary-turquoise px-2.5 text-[13px] font-semibold text-ink-strong transition-[filter] hover:brightness-95 disabled:opacity-60"
      >
        <IconoImagen />
        {subiendo ? t("subiendoImagen") : t("imagen")}
      </button>
      <input
        ref={archivoRef}
        type="file"
        accept={FORMATOS_ACEPTADOS}
        className="hidden"
        onChange={(evento) => {
          const archivo = evento.target.files?.[0];
          evento.target.value = "";
          if (archivo) void subir(archivo);
        }}
      />

      <span className="mx-1 h-5 w-0.5 bg-ink/25" aria-hidden="true" />

      <label
        title={t("colorTexto")}
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-theme border-(length:--borde) border-ink bg-card px-2 font-diario text-sm font-bold text-ink hover:bg-secondary-turquoise/25"
      >
        <span aria-hidden="true" style={{ color: colorTexto }}>
          A
        </span>
        <input
          type="color"
          aria-label={t("colorTexto")}
          value={colorTexto}
          onChange={(evento) => editor.chain().focus().setColor(evento.target.value).run()}
          className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </label>
      <button
        type="button"
        title={t("quitarColorTexto")}
        aria-label={t("quitarColorTexto")}
        onMouseDown={(evento) => {
          evento.preventDefault();
          editor.chain().focus().unsetColor().run();
        }}
        className="flex h-8 min-w-8 items-center justify-center rounded-theme border-(length:--borde) border-ink bg-card text-ink hover:bg-secondary-turquoise/25"
      >
        <IconoQuitar />
      </button>

      <label
        title={t("resaltar")}
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-theme border-(length:--borde) border-ink bg-card px-2 font-diario text-sm font-bold text-ink hover:bg-secondary-turquoise/25"
      >
        <span aria-hidden="true" className="rounded px-1" style={{ backgroundColor: colorResaltado }}>
          A
        </span>
        <input
          type="color"
          aria-label={t("resaltar")}
          value={colorResaltado}
          onChange={(evento) =>
            editor.chain().focus().setHighlight({ color: evento.target.value }).run()
          }
          className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </label>
      <button
        type="button"
        title={t("quitarResaltado")}
        aria-label={t("quitarResaltado")}
        onMouseDown={(evento) => {
          evento.preventDefault();
          editor.chain().focus().unsetHighlight().run();
        }}
        className="flex h-8 min-w-8 items-center justify-center rounded-theme border-(length:--borde) border-ink bg-card text-ink hover:bg-secondary-turquoise/25"
      >
        <IconoQuitar />
      </button>

      {errorImagen ? (
        <div
          role="alert"
          className="flex w-full flex-wrap items-center gap-2 border-(length:--borde) border-ink rounded-theme bg-primary-pink px-3 py-2 text-ink-strong"
        >
          <span className="min-w-0 flex-1 text-sm">{t(`errorImagen.${errorImagen}`)}</span>
          {pendiente ? (
            <button
              type="button"
              onClick={() => void subir(pendiente)}
              disabled={subiendo}
              className="flex h-9 items-center border-(length:--borde) border-ink rounded-theme bg-background px-3 text-[13px] font-semibold text-ink disabled:opacity-60"
            >
              {t("reintentar")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setErrorImagen(null);
              setPendiente(null);
            }}
            className="flex h-9 items-center px-2 text-[13px] font-semibold underline-offset-2 hover:underline"
          >
            {t("descartar")}
          </button>
        </div>
      ) : null}

      <DialogoEnlace
        abierto={enlaceAbierto}
        urlActual={(editor.getAttributes("link").href as string | undefined) ?? ""}
        onCerrar={() => setEnlaceAbierto(false)}
        onGuardar={(url) => {
          setEnlaceAbierto(false);
          editor.chain().focus().setLink({ href: url }).run();
        }}
        onQuitar={() => {
          setEnlaceAbierto(false);
          editor.chain().focus().unsetLink().run();
        }}
      />
    </div>
  );
}
