"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { useState } from "react";
import { tiptapExtensions } from "@/lib/tiptap-extensions";

const CONTENIDO_VACIO: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

type TiptapEditorProps = {
  name: string;
  contenidoInicial?: JSONContent | null;
};

export function TiptapEditor({ name, contenidoInicial }: TiptapEditorProps) {
  const [json, setJson] = useState<JSONContent>(contenidoInicial ?? CONTENIDO_VACIO);

  const editor = useEditor({
    extensions: tiptapExtensions,
    content: contenidoInicial ?? CONTENIDO_VACIO,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setJson(editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc max-w-none min-h-[240px] focus:outline-none dark:prose-invert",
      },
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Barra editor={editor} />
      <div className="rounded-lg border border-black/10 px-4 py-3 dark:border-white/15">
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

  return (
    <div className="flex flex-wrap gap-1">
      {botones.map((boton) => (
        <button
          key={boton.etiqueta}
          type="button"
          title={boton.titulo}
          onClick={boton.accion}
          aria-pressed={boton.activo}
          className={`rounded px-2 py-1 text-sm transition-colors ${boton.claseExtra ?? ""} ${
            boton.activo
              ? "bg-foreground text-background"
              : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          }`}
        >
          {boton.etiqueta}
        </button>
      ))}
      <button
        type="button"
        title="Enlace"
        onClick={() => {
          const url = window.prompt("URL del enlace");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          } else {
            editor.chain().focus().unsetLink().run();
          }
        }}
        aria-pressed={editor.isActive("link")}
        className={`rounded px-2 py-1 text-sm underline transition-colors ${
          editor.isActive("link")
            ? "bg-foreground text-background"
            : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
        }`}
      >
        Enlace
      </button>
    </div>
  );
}
