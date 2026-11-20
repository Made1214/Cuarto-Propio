// Genera el set curado de cursores (src/lib/temas/cursores.ts) como PNG de
// 32×32: pixel art de 16×16 escalado al doble, sin suavizar.
// Uso: node scripts/generar-cursores.mjs public/cursores
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const salida = process.argv[2] ?? "public/cursores";
mkdirSync(salida, { recursive: true });

const COLORES = { X: "#3D2C4F", W: "#FFFFFF", P: "#F0AEC4", T: "#74C7C3", G: "#9BCFAE", M: "#E8C9A0" };

const DIBUJOS = {
  flecha: [
    "X", "XX", "XWX", "XWWX", "XWWWX", "XWWWWX", "XWWWWWX", "XWWWWWWX",
    "XWWWWWWWX", "XWWWWXXXXX", "XWWXWX", "XWX.XWX", "XX..XWX", "X....XWX", ".....XWX", "......XX",
  ],
  corazon: [
    "", "..XXX....XXX", ".XPPPX..XPPPX", "XPPWPPXXPPPPPX", "XPWPPPPPPPPPPX", "XPPPPPPPPPPPPX",
    ".XPPPPPPPPPPX", "..XPPPPPPPPX", "...XPPPPPPX", "....XPPPPX", ".....XPPX", "......XX",
  ],
  estrella: [
    ".......X", "......XTX", "......XTX", ".....XTTTX", "XXXXXTTTTTXXXXX", ".XTTTTTTTTTTTX",
    "..XTTTTTTTTTX", "...XTTTTTTTX", "...XTTTTTTTX", "..XTTTTXTTTTX", "..XTTTX.XTTTX",
    ".XTTX.....XTTX", ".XXX.......XXX",
  ],
  lapiz: [
    "............XX", "...........XPPX", "..........XGGPX", ".........XGGGX", "........XGGGX",
    ".......XGGGX", "......XGGGX", ".....XGGGX", "....XGGGX", "...XMGGX", "..XMMMX", "..XMMX",
    ".XXX", ".XX", "X",
  ],
};

for (const [nombre, filas] of Object.entries(DIBUJOS)) {
  let rects = "";
  filas.forEach((fila, y) => {
    [...fila].forEach((c, x) => {
      if (COLORES[c]) rects += `<rect x="${x * 2}" y="${y * 2}" width="2" height="2" fill="${COLORES[c]}"/>`;
    });
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">${rects}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${salida}/${nombre}.png`);
}
