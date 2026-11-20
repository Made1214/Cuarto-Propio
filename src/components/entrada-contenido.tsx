import { createElement, type CSSProperties, type ReactNode } from "react";
import { getSchema, type JSONContent } from "@tiptap/core";
import { DOMSerializer, Node as NodoPM } from "@tiptap/pm/model";
import { esUrlImagenDiario } from "@/lib/diario/imagenes";
import { tiptapExtensions } from "@/lib/tiptap-extensions";

/**
 * Renderiza el contenido de una entrada en modo lectura, con las mismas
 * extensiones que el editor (para que negritas, colores, citas, etc. se
 * vean igual). Es un Server Component: Tiptap/ProseMirror no viajan al
 * navegador al leer el diario y el texto llega ya pintado en el HTML, sin
 * esperar a hidratar.
 *
 * Usa el mismo `DOMSerializer` de ProseMirror que pinta el editor (con el
 * `renderHTML` de cada extensión), pero en vez del DOM del navegador le
 * pasa un `document` mínimo que arma un árbol en memoria, que después se
 * convierte en elementos de React. Se probó `@tiptap/static-renderer`,
 * pero anida las marks al revés que el editor (un enlace con color quedaba
 * `<a><span>` en vez de `<span><a>`, y el color del enlace de `prose` le
 * ganaba al elegido) y parte en varios `<a>` un enlace con tramos en
 * negrita; con el serializador del editor la salida es la misma.
 *
 * Seguridad: no hay innerHTML — el texto y los atributos los escapa React.
 * El `renderHTML` de Link vacía el `href` de protocolos no permitidos
 * (`javascript:`, `data:`…), y React además bloquea `javascript:`.
 */
export function EntradaContenido({ contenido }: { contenido: JSONContent }) {
  return (
    // Las clases extra replican lo que el CSS de ProseMirror le da al editor
    // (`white-space: break-spaces`, cortar palabras largas, sin ligaduras),
    // para que los espacios seguidos o al inicio de línea se vean igual que
    // al escribirlos.
    <div className="diario-prose prose max-w-none whitespace-break-spaces wrap-break-word [font-variant-ligatures:none]">
      {renderizar(contenido)}
    </div>
  );
}

// El esquema solo depende de las extensiones: se arma una vez por proceso.
const esquema = getSchema(tiptapExtensions);
const serializador = DOMSerializer.fromSchema(esquema);

function renderizar(contenido: JSONContent): ReactNode {
  try {
    const doc = NodoPM.fromJSON(esquema, prepararJSON(contenido)[0]);
    const raiz = serializador.serializeFragment(doc.content, {
      document: documentoEnMemoria as unknown as Document,
    }) as unknown as NodoEnMemoria;
    return raiz.hijos.map(aReact);
  } catch (error) {
    // JSON malformado (no debería pasar: lo genera el propio editor).
    console.error("No se pudo renderizar la entrada", error);
    return null;
  }
}

/**
 * Deja el JSON listo para el esquema. Devuelve una lista porque un nodo
 * desconocido se reemplaza por sus hijos.
 *
 * - Un nodo o mark que estas extensiones ya no conocen (contenido viejo, o
 *   una extensión que se quitó) no debe tirar la página entera: se muestra
 *   lo que tiene adentro, sin su envoltorio.
 * - ProseMirror le agrega un `<br>` de relleno a todo bloque de texto vacío
 *   o que termina en algo que no es texto (un salto de línea con
 *   Shift+Enter) — sin él, un `<p></p>` mide cero y las líneas en blanco que
 *   la usuaria dejó para separar ideas desaparecerían.
 */
function prepararJSON(nodo: JSONContent): JSONContent[] {
  const hijos = nodo.content?.flatMap(prepararJSON);
  const tipo = nodo.type ? esquema.nodes[nodo.type] : undefined;
  if (!tipo) return hijos ?? [];
  // Una imagen que no es de la app no se muestra (ni como hueco vacío).
  if (nodo.type === "image" && !esUrlImagenDiario(nodo.attrs?.src)) return [];

  const preparado: JSONContent = {
    ...nodo,
    marks: nodo.marks?.filter((mark) => mark.type in esquema.marks),
    content: hijos,
  };
  if (tipo.isTextblock) {
    const ultimo = hijos?.at(-1);
    if (!ultimo || ultimo.type !== "text" || ultimo.text?.endsWith("\n")) {
      preparado.content = [...(hijos ?? []), { type: "hardBreak" }];
    }
  }
  return [preparado];
}

// --- `document` mínimo para el DOMSerializer ---------------------------
// Solo implementa lo que ProseMirror usa al serializar (crear elementos,
// textos y fragmentos, poner atributos, agregar hijos).

type NodoEnMemoria = {
  nodeType: number;
  etiqueta?: string;
  atributos: Record<string, string>;
  hijos: (NodoEnMemoria | string)[];
  appendChild(hijo: NodoEnMemoria | string): void;
  setAttribute(nombre: string, valor: string): void;
  setAttributeNS(ns: string | null, nombre: string, valor: string): void;
};

function crearNodo(nodeType: number, etiqueta?: string): NodoEnMemoria {
  return {
    nodeType,
    etiqueta,
    atributos: {},
    hijos: [],
    appendChild(hijo) {
      this.hijos.push(hijo);
    },
    setAttribute(nombre, valor) {
      this.atributos[nombre] = String(valor);
    },
    setAttributeNS(_ns, nombre, valor) {
      this.atributos[nombre] = String(valor);
    },
  };
}

const documentoEnMemoria = {
  createDocumentFragment: () => crearNodo(11),
  createElement: (etiqueta: string) => crearNodo(1, etiqueta),
  createElementNS: (_ns: string, etiqueta: string) => crearNodo(1, etiqueta),
  // Un texto es solo su string: React lo escapa al renderizar.
  createTextNode: (texto: string) => texto,
};

const ATRIBUTO_A_PROP: Record<string, string> = {
  class: "className",
  colspan: "colSpan",
  rowspan: "rowSpan",
};

function aReact(nodo: NodoEnMemoria | string, indice: number): ReactNode {
  if (typeof nodo === "string") return nodo;

  const props: Record<string, unknown> = { key: indice };
  for (const [nombre, valor] of Object.entries(nodo.atributos)) {
    if (nombre === "style") props.style = estiloAObjeto(valor);
    else props[ATRIBUTO_A_PROP[nombre] ?? nombre] = valor;
  }
  const hijos = nodo.hijos.map(aReact);
  const elemento = createElement(nodo.etiqueta ?? "span", props, ...hijos);

  // Una foto del diario se lee en miniatura y se toca para verla completa.
  // Solo URLs de la app (las filtra la extensión de imagen al guardar y acá
  // de nuevo, por si el JSON viniera de otro lado).
  const completa = nodo.atributos["data-completa"];
  if (nodo.etiqueta === "img" && esUrlImagenDiario(completa)) {
    return createElement(
      "a",
      { key: indice, href: completa, target: "_blank", rel: "noopener", className: "enlace-imagen-diario" },
      createElement(nodo.etiqueta, { ...props, key: undefined }),
    );
  }
  return elemento;
}

/** `"color: #f00; background-color: #ff0"` → `{ color, backgroundColor }`
 * (React pide `style` como objeto). */
function estiloAObjeto(estilo: string): CSSProperties {
  const objeto: Record<string, string> = {};
  for (const declaracion of estilo.split(";")) {
    const dosPuntos = declaracion.indexOf(":");
    if (dosPuntos === -1) continue;
    const propiedad = declaracion.slice(0, dosPuntos).trim();
    const valor = declaracion.slice(dosPuntos + 1).trim();
    if (!propiedad || !valor) continue;
    const clave = propiedad.startsWith("--")
      ? propiedad
      : propiedad.replace(/^-ms-/, "ms-").replace(/-([a-z])/g, (_, letra: string) => letra.toUpperCase());
    objeto[clave] = valor;
  }
  return objeto;
}
