"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { tiptapExtensions } from "@/lib/tiptap-extensions";

/**
 * Renderiza el contenido de una entrada en modo lectura, con las mismas
 * extensiones que el editor (para que negritas, colores, citas, etc. se
 * vean igual). `generateHTML` de Tiptap necesita el DOM del navegador, así
 * que no se puede resolver en el servidor — esto corre del lado del
 * cliente en su lugar.
 */
export function EntradaContenido({ contenido }: { contenido: JSONContent }) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: contenido,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "diario-prose prose max-w-none" },
    },
  });

  return <EditorContent editor={editor} />;
}
