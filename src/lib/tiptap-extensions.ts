import { Color, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import { esUrlImagenDiario } from "@/lib/diario/imagenes";

/**
 * Imagen del Diario: solo acepta las que pasaron por el pipeline de la app
 * (`/api/diario/imagen?ruta=…`). Una imagen pegada desde otra web no entra:
 * no queremos que el diario cargue archivos de terceros (que además se
 * enteran de cada vez que se abre la entrada).
 *
 * Guarda la miniatura en `src` (la que se ve en el cuerpo) y la versión
 * completa en `completa`, para ampliarla. `ancho`/`alto` reservan el lugar
 * antes de que cargue, así el texto no salta.
 */
const ImagenDiario = Image.extend({
  parseHTML() {
    return [{ tag: 'img[src^="/api/diario/imagen?"]' }];
  },
  addAttributes() {
    return {
      src: {
        default: null,
        renderHTML: (atributos) => (esUrlImagenDiario(atributos.src) ? { src: atributos.src } : {}),
      },
      alt: { default: null },
      completa: {
        default: null,
        parseHTML: (elemento) => elemento.getAttribute("data-completa"),
        renderHTML: (atributos) =>
          esUrlImagenDiario(atributos.completa) ? { "data-completa": atributos.completa } : {},
      },
      ancho: {
        default: null,
        parseHTML: (elemento) => Number(elemento.getAttribute("width")) || null,
        renderHTML: (atributos) => (atributos.ancho ? { width: String(atributos.ancho) } : {}),
      },
      alto: {
        default: null,
        parseHTML: (elemento) => Number(elemento.getAttribute("height")) || null,
        renderHTML: (atributos) => (atributos.alto ? { height: String(atributos.alto) } : {}),
      },
    };
  },
}).configure({
  allowBase64: false,
  HTMLAttributes: { loading: "lazy", class: "imagen-diario" },
});

export const tiptapExtensions = [
  StarterKit,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  ImagenDiario,
];
