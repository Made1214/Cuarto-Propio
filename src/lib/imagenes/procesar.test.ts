import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { TAMANO_MAXIMO_BYTES } from "./limites";
import { FormatoNoSoportadoError, generarMiniatura, procesarImagen } from "./procesar";

type Formato = "png" | "jpeg" | "webp" | "gif";

async function imagen(ancho: number, alto: number, formato: Formato = "png", orientacion?: number) {
  let s = sharp({ create: { width: ancho, height: alto, channels: 3, background: "#9BCFAE" } });
  s = formato === "jpeg" && orientacion ? s.jpeg().withMetadata({ orientation: orientacion }) : s[formato]();
  const b = await s.toBuffer();
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

const metadatos = (b: Buffer) => sharp(b).metadata();
const bytes = (texto: string) => new TextEncoder().encode(texto).buffer as ArrayBuffer;

describe("procesarImagen: formato real", () => {
  it.each(["png", "jpeg", "webp"] as const)("acepta %s", async (f) => {
    await expect(procesarImagen(await imagen(50, 40, f))).resolves.toBeDefined();
  });
  it("rechaza GIF aunque sea una imagen válida", async () => {
    await expect(procesarImagen(await imagen(20, 20, "gif"))).rejects.toThrow(FormatoNoSoportadoError);
  });
  it("rechaza SVG, texto, HTML disfrazado y archivos vacíos o corruptos", async () => {
    const malos = [
      bytes('<svg xmlns="http://www.w3.org/2000/svg" width="5" height="5"/>'),
      bytes("hola"),
      bytes("<html><script>alert(1)</script></html>"),
      new ArrayBuffer(0),
      bytes("\x89PNG\r\n\x1a\n corrupto"),
    ];
    for (const m of malos) await expect(procesarImagen(m)).rejects.toThrow(FormatoNoSoportadoError);
  });
});

describe("procesarImagen: versiones", () => {
  it("una foto grande sale en WebP: completa a 2000 px y miniatura a 600 px", async () => {
    const r = await procesarImagen(await imagen(3000, 1500));
    expect(r.tipoMiniatura).toBe("cuadricula");
    expect(r.ancho).toBe(2000);
    expect(r.alto).toBe(1000);
    const [c, m] = await Promise.all([metadatos(r.completa), metadatos(r.miniatura)]);
    expect([c.format, c.width]).toEqual(["webp", 2000]);
    expect([m.format, m.width, m.height]).toEqual(["webp", 600, 300]);
  });
  it("una foto chica no se agranda", async () => {
    const r = await procesarImagen(await imagen(300, 200));
    expect([r.ancho, r.alto]).toEqual([300, 200]);
    expect((await metadatos(r.miniatura)).width).toBe(300);
  });
  it("el avatar sale cuadrado de 160 px, recortado al centro", async () => {
    const r = await procesarImagen(await imagen(800, 400), "avatar");
    expect(r.tipoMiniatura).toBe("avatar");
    const m = await metadatos(r.miniatura);
    expect([m.width, m.height]).toEqual([160, 160]);
  });
  it("aplica la orientación EXIF (foto de costado queda derecha)", async () => {
    const r = await procesarImagen(await imagen(40, 20, "jpeg", 6));
    expect([r.ancho, r.alto]).toEqual([20, 40]);
  });
});

describe("generarMiniatura", () => {
  it("acepta un Buffer y da WebP", async () => {
    const b = Buffer.from(await imagen(1200, 600));
    expect((await metadatos(await generarMiniatura(b, "cuadricula"))).width).toBe(600);
  });
});

describe("límites", () => {
  it("el tope de subida es 25 MB", () => expect(TAMANO_MAXIMO_BYTES).toBe(25 * 1024 * 1024));
});
