import { Color, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";

// Compartido entre el editor (cliente) y las Server Actions (para derivar
// contenido_texto con generateText a partir del mismo JSON).
export const tiptapExtensions = [
  StarterKit,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
];
