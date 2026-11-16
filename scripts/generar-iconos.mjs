// Genera los íconos de la PWA (public/icons/) a partir del corazón pixelado
// de la marca. Uso: node scripts/generar-iconos.mjs public/icons
import sharp from "sharp";
const salida = process.argv[2];
// Corazón pixelado de la marca (14×12 celdas), rosa sobre el morado oscuro.
const corazon = "M2 0h4v2H2zM8 0h4v2H8zM0 2h14v4H0zM2 6h10v2H2zM4 8h6v2H4zM6 10h2v2H6z";
function svg(tamano, relleno) {
  const ancho = tamano * relleno, escala = ancho / 14, alto = 12 * escala;
  const x = (tamano - ancho) / 2, y = (tamano - alto) / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#5B3F73"/><path transform="translate(${x} ${y}) scale(${escala})" d="${corazon}" fill="#F0AEC4"/></svg>`);
}
const piezas = [["icon-192.png",192,0.56],["icon-512.png",512,0.56],["icon-maskable-512.png",512,0.42],["apple-touch-icon.png",180,0.56]];
for (const [nombre,t,r] of piezas) await sharp(svg(t,r)).png().toFile(`${salida}/${nombre}`);
