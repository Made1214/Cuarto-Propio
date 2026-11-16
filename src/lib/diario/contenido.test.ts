import { describe, expect, it } from "vitest";
import { contenidoVacio } from "./contenido";

const parrafo = (...content: object[]) => ({ type: "paragraph", content });
const doc = (...content: object[]) => ({ type: "doc", content });

describe("contenidoVacio", () => {
  it("sin documento, está vacío", () => {
    expect(contenidoVacio(null)).toBe(true);
    expect(contenidoVacio(undefined)).toBe(true);
    expect(contenidoVacio({})).toBe(true);
  });

  it("un documento en blanco o con párrafos vacíos está vacío", () => {
    expect(contenidoVacio(doc())).toBe(true);
    expect(contenidoVacio(doc({ type: "paragraph" }, { type: "paragraph" }))).toBe(true);
  });

  it("solo espacios, saltos de línea o una línea horizontal no es contenido", () => {
    expect(
      contenidoVacio(
        doc(parrafo({ type: "text", text: "   " }, { type: "hardBreak" }), { type: "horizontalRule" }),
      ),
    ).toBe(true);
  });

  it("con texto no está vacío, aunque esté hondo (una cita, una lista)", () => {
    expect(contenidoVacio(doc(parrafo({ type: "text", text: "Hoy llovió" })))).toBe(false);
    expect(
      contenidoVacio(
        doc({
          type: "bulletList",
          content: [{ type: "listItem", content: [parrafo({ type: "text", text: " a " })] }],
        }),
      ),
    ).toBe(false);
  });

  it("una entrada que solo tiene una imagen sí tiene contenido", () => {
    expect(contenidoVacio(doc({ type: "image", attrs: { src: "/api/diario/imagen?ruta=x" } }))).toBe(false);
  });
});
