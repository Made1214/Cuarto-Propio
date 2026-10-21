"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { useTranslations } from "next-intl";
import { useReducer, useState } from "react";
import { DialogoEnlace } from "@/components/dialogo-enlace";
import {
  IconoCita,
  IconoCursiva,
  IconoEnlace,
  IconoLista,
  IconoListaNumerada,
  IconoNegrita,
  IconoQuitar,
  IconoTachado,
  IconoTitulo,
} from "@/components/editor-iconos";
import { tiptapExtensions } from "@/lib/tiptap-extensions";

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
      attributes: {
        class: "diario-prose prose max-w-none min-h-[240px] focus:outline-none",
      },
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Barra editor={editor} />
      <div className="rounded-theme border-2 border-ink bg-card px-4 py-3">
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={JSON.stringify(json)} />
    </div>
  );
}

function Barra({ editor }: { editor: Editor | null }) {
  const t = useTranslations("editor");
  const [enlaceAbierto, setEnlaceAbierto] = useState(false);

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
          className={`flex h-8 min-w-8 items-center justify-center rounded-theme border-2 border-ink px-2 transition-colors ${
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
        className={`flex h-8 min-w-8 items-center justify-center rounded-theme border-2 border-ink px-2 transition-colors ${
          editor.isActive("link")
            ? "bg-secondary-purple text-background"
            : "bg-card text-ink hover:bg-secondary-turquoise/25"
        }`}
      >
        <IconoEnlace />
      </button>

      <span className="mx-1 h-5 w-0.5 bg-ink/25" aria-hidden="true" />

      <label
        title={t("colorTexto")}
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-theme border-2 border-ink bg-card px-2 font-diario text-sm font-bold text-ink hover:bg-secondary-turquoise/25"
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
        className="flex h-8 min-w-8 items-center justify-center rounded-theme border-2 border-ink bg-card text-ink hover:bg-secondary-turquoise/25"
      >
        <IconoQuitar />
      </button>

      <label
        title={t("resaltar")}
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-theme border-2 border-ink bg-card px-2 font-diario text-sm font-bold text-ink hover:bg-secondary-turquoise/25"
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
        className="flex h-8 min-w-8 items-center justify-center rounded-theme border-2 border-ink bg-card text-ink hover:bg-secondary-turquoise/25"
      >
        <IconoQuitar />
      </button>

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
