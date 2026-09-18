"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { useReducer, useState } from "react";
import { tiptapExtensions } from "@/lib/tiptap-extensions";

const CONTENIDO_VACIO: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
const COLOR_TEXTO_DEFECTO = "#171717";
const COLOR_RESALTADO_DEFECTO = "#fde68a";

type TiptapEditorProps = {
  name: string;
  contenidoInicial?: JSONContent | null;
};

export function TiptapEditor({ name, contenidoInicial }: TiptapEditorProps) {
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
    onUpdate: ({ editor }) => setJson(editor.getJSON()),
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
  if (!editor) return null;

  const botones: {
    etiqueta: string;
    titulo: string;
    activo: boolean;
    accion: () => void;
    claseExtra?: string;
  }[] = [
    {
      etiqueta: "N",
      titulo: "Negrita",
      activo: editor.isActive("bold"),
      accion: () => editor.chain().focus().toggleBold().run(),
      claseExtra: "font-bold",
    },
    {
      etiqueta: "K",
      titulo: "Cursiva",
      activo: editor.isActive("italic"),
      accion: () => editor.chain().focus().toggleItalic().run(),
      claseExtra: "italic",
    },
    {
      etiqueta: "S",
      titulo: "Tachado",
      activo: editor.isActive("strike"),
      accion: () => editor.chain().focus().toggleStrike().run(),
      claseExtra: "line-through",
    },
    {
      etiqueta: "H2",
      titulo: "Título",
      activo: editor.isActive("heading", { level: 2 }),
      accion: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      etiqueta: "H3",
      titulo: "Subtítulo",
      activo: editor.isActive("heading", { level: 3 }),
      accion: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      etiqueta: "•",
      titulo: "Lista",
      activo: editor.isActive("bulletList"),
      accion: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      etiqueta: "1.",
      titulo: "Lista numerada",
      activo: editor.isActive("orderedList"),
      accion: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      etiqueta: "❝",
      titulo: "Cita",
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
          key={boton.etiqueta}
          type="button"
          title={boton.titulo}
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
          className={`rounded-theme border-2 border-ink px-2 py-1 font-pixel text-xs transition-colors ${boton.claseExtra ?? ""} ${
            boton.activo
              ? "bg-secondary-purple text-background"
              : "bg-card text-ink hover:bg-secondary-turquoise/25"
          }`}
        >
          {boton.etiqueta}
        </button>
      ))}
      <button
        type="button"
        title="Enlace"
        onMouseDown={(evento) => {
          evento.preventDefault();
          const url = window.prompt("URL del enlace");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          } else {
            editor.chain().focus().unsetLink().run();
          }
        }}
        aria-pressed={editor.isActive("link")}
        className={`rounded-theme border-2 border-ink px-2 py-1 font-pixel text-xs underline transition-colors ${
          editor.isActive("link")
            ? "bg-secondary-purple text-background"
            : "bg-card text-ink hover:bg-secondary-turquoise/25"
        }`}
      >
        Enlace
      </button>

      <span className="mx-1 h-5 w-0.5 bg-ink/25" aria-hidden="true" />

      <label
        title="Color de texto"
        className="flex cursor-pointer items-center gap-1 rounded-theme border-2 border-ink bg-card px-2 py-1 font-pixel text-xs text-ink hover:bg-secondary-turquoise/25"
      >
        A
        <input
          type="color"
          value={colorTexto}
          onChange={(evento) => editor.chain().focus().setColor(evento.target.value).run()}
          className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </label>
      <button
        type="button"
        title="Quitar color de texto"
        onMouseDown={(evento) => {
          evento.preventDefault();
          editor.chain().focus().unsetColor().run();
        }}
        className="rounded-theme border-2 border-ink bg-card px-2 py-1 font-pixel text-xs text-ink hover:bg-secondary-turquoise/25"
      >
        ×
      </button>

      <label
        title="Resaltar texto"
        className="flex cursor-pointer items-center gap-1 rounded-theme border-2 border-ink bg-card px-2 py-1 font-pixel text-xs text-ink hover:bg-secondary-turquoise/25"
      >
        <span
          className="rounded px-1"
          style={{ backgroundColor: editor.isActive("highlight") ? colorResaltado : "transparent" }}
        >
          H
        </span>
        <input
          type="color"
          value={colorResaltado}
          onChange={(evento) =>
            editor.chain().focus().setHighlight({ color: evento.target.value }).run()
          }
          className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </label>
      <button
        type="button"
        title="Quitar resaltado"
        onMouseDown={(evento) => {
          evento.preventDefault();
          editor.chain().focus().unsetHighlight().run();
        }}
        className="rounded-theme border-2 border-ink bg-card px-2 py-1 font-pixel text-xs text-ink hover:bg-secondary-turquoise/25"
      >
        ×
      </button>
    </div>
  );
}
