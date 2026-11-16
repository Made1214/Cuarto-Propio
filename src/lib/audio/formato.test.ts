import { describe, expect, it } from "vitest";
import { detectarFormato, FormatoNoSoportadoError } from "./formato";

/** Arma un buffer de 16 bytes con los bytes dados al principio o en `desde`. */
function buffer(bytes: number[], desde = 0): ArrayBuffer {
  const b = new Uint8Array(16);
  b.set(bytes, desde);
  return b.buffer;
}
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

describe("detectarFormato", () => {
  it("reconoce WebM, Ogg, M4A, WAV y MP3 por sus bytes", () => {
    expect(detectarFormato(buffer([0x1a, 0x45, 0xdf, 0xa3])).mime).toBe("audio/webm");
    expect(detectarFormato(buffer(ascii("OggS"))).extension).toBe("ogg");
    expect(detectarFormato(buffer(ascii("ftyp"), 4)).mime).toBe("audio/mp4");
    expect(detectarFormato(buffer([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WAVE")])).extension).toBe("wav");
    expect(detectarFormato(buffer(ascii("ID3"))).mime).toBe("audio/mpeg");
    expect(detectarFormato(buffer([0xff, 0xfb])).extension).toBe("mp3");
  });
  it("rechaza imágenes, texto y archivos vacíos o muy cortos", () => {
    const png = buffer([0x89, ...ascii("PNG")]);
    for (const malo of [png, buffer(ascii("hola mundo")), new ArrayBuffer(0), new ArrayBuffer(5)])
      expect(() => detectarFormato(malo)).toThrow(FormatoNoSoportadoError);
  });
  it("no se deja engañar por la extensión: RIFF sin WAVE no es audio", () => {
    expect(() => detectarFormato(buffer([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")]))).toThrow(
      FormatoNoSoportadoError,
    );
  });
});
