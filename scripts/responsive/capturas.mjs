// Capturas responsive: fotografía las pantallas de la app en varios
// dispositivos, temas y modos, y revisa dos cosas que se escapan a simple
// vista (desborde horizontal y botones demasiado chicos para el dedo).
//
//   npm run responsive                        # celulares, Retro, claro
//   npm run responsive -- --temas=todos --modo=ambos
//   npm run responsive -- --dispositivos=todos --pwa --teclado
//   npm run responsive -- --rutas=/vitrina,/diario/nueva --dispositivos="iPhone SE,Pixel 8"
//
// Levanta un Supabase simulado (`supabase-simulado.mjs`) y `next dev`
// apuntando a él, así no hace falta ninguna cuenta ni toca la base real.
// Con `--url=http://localhost:3000` usa un servidor que ya esté corriendo
// (que tiene que apuntar al Supabase simulado: ver ese archivo).
//
// Qué es y qué no es: Chromium con el tamaño, la densidad, el user agent y
// el modo táctil de cada dispositivo. Reproduce bien el layout, los cortes
// y los tamaños; NO es Safari de iOS (ni su teclado, ni su barra de estado).
// `--pwa` usa el alto de la app instalada (pantalla completa menos la barra
// de estado) en vez del de la pestaña del navegador, y `--teclado` enfoca el
// primer campo y le resta al alto lo que ocupa un teclado: una
// aproximación de lo que queda a la vista mientras se escribe.
//
// Salida en `capturas-responsive/` (ignorada por git): una imagen por
// captura, una hoja por pantalla con todos los dispositivos lado a lado,
// `index.html` para mirarlas en el navegador y `reporte.json`.

import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";
import sharp from "sharp";
import { cambiarTema, cookieSesion, iniciarSupabaseSimulado, PUERTO } from "./supabase-simulado.mjs";

// ── Opciones ──
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [clave, ...resto] = arg.replace(/^--/, "").split("=");
    return [clave, resto.length ? resto.join("=") : true];
  }),
);

const GRUPOS_DISPOSITIVOS = {
  celulares: ["iPhone SE", "iPhone SE (3rd gen)", "iPhone 15", "iPhone 15 Pro Max", "Galaxy S24", "Pixel 8"],
  todos: ["iPhone SE", "iPhone SE (3rd gen)", "iPhone 15", "iPhone 15 Pro Max", "Galaxy S24", "Pixel 8", "Galaxy A55", "iPad Mini", "Escritorio"],
};
const nombresDispositivos = (GRUPOS_DISPOSITIVOS[args.dispositivos ?? "celulares"] ?? String(args.dispositivos).split(",")).map((d) => d.trim());

const RUTAS_PUBLICAS = ["/login", "/registro"];
const RUTAS_APP = ["/diario", "/diario/nueva", "/diario/en0", "/diario/en0/editar", "/listas", "/vitrina", "/vitrina/pz1", "/audio", "/personalizacion"];
const rutas = args.rutas ? String(args.rutas).split(",").map((r) => r.trim()) : [...RUTAS_PUBLICAS, ...RUTAS_APP];

const TEMAS = ["retro", "whimsical", "softsignal", "void"];
const temas = args.temas === "todos" ? TEMAS : String(args.temas ?? "retro").split(",");
const modos = args.modo === "ambos" ? ["claro", "oscuro"] : [String(args.modo ?? "claro")];
const variantes = [args.pwa ? "pwa" : "navegador", ...(args.teclado ? ["teclado"] : [])];
const idioma = String(args.idioma ?? "es");

const puertoApp = Number(args.puerto ?? 3123);
const urlBase = String(args.url ?? `http://localhost:${puertoApp}`);
const salida = path.resolve(String(args.salida ?? "capturas-responsive"));

/** Lo que tapa la barra de estado en una app instalada, y el teclado. */
const BARRA_ESTADO = { ios: 47, android: 24 };
const TECLADO = { ios: 336, android: 300 };

function dispositivo(nombre) {
  if (nombre === "Escritorio") {
    return { opciones: { viewport: { width: 1440, height: 900 } }, sistema: "escritorio" };
  }
  const base = devices[nombre];
  if (!base) throw new Error(`Dispositivo desconocido: «${nombre}». Ver los nombres en playwright (devices).`);
  const opciones = { ...base };
  delete opciones.defaultBrowserType;
  const sistema = /iPhone|iPad/.test(nombre) ? "ios" : "android";
  return { opciones: { ...opciones, deviceScaleFactor: 1 }, sistema, pantalla: base.screen };
}

/** Alto visible: el de la pestaña del navegador, o con `--pwa` el de la app
 * instalada (pantalla completa menos la barra de estado); con el teclado
 * abierto, eso menos el teclado (no en tablets ni escritorio). */
function alto({ opciones, sistema, pantalla }, variante) {
  if (sistema === "escritorio") return opciones.viewport.height;
  const base = args.pwa && pantalla ? pantalla.height - BARRA_ESTADO[sistema] : opciones.viewport.height;
  const esTablet = opciones.viewport.width >= 600;
  return variante === "teclado" && !esTablet ? base - TECLADO[sistema] : base;
}

// ── Servidores ──
async function esperar(url, segundos = 180) {
  const limite = Date.now() + segundos * 1000;
  while (Date.now() < limite) {
    try {
      const respuesta = await fetch(url, { redirect: "manual" });
      if (respuesta.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`No respondió ${url}`);
}

if (!args.url) {
  // Un servidor que ya estuviera en el puerto podría apuntar a la base real
  // (o ser de una corrida que quedó colgada): mejor avisar que usarlo.
  const ocupado = await fetch(urlBase, { redirect: "manual" }).then(() => true, () => false);
  if (ocupado) {
    console.error(`Ya hay algo escuchando en ${urlBase}. Ciérralo, usa --puerto=otro o --url=${urlBase} si apunta al Supabase simulado.`);
    process.exit(1);
  }
}

const supabase = await iniciarSupabaseSimulado();
let next;
if (!args.url) {
  next = spawn("npx", ["next", "dev", "-p", String(puertoApp)], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${PUERTO}`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "simulada",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "ignore", "inherit"],
    // Grupo propio: al terminar se cierra npx y también el next-server que
    // lanza (matar solo a npx dejaba el servidor ocupando el puerto).
    detached: true,
  });
  console.log(`Levantando la app en ${urlBase}…`);
}

async function cerrar() {
  if (next?.pid) {
    try {
      process.kill(-next.pid, "SIGTERM");
    } catch {}
  }
  supabase.close();
}
process.on("SIGINT", async () => {
  await cerrar();
  process.exit(1);
});
// Si algo falla, que no quede `next dev` corriendo suelto.
process.on("uncaughtException", async (error) => {
  console.error(error);
  await cerrar();
  process.exit(1);
});
process.on("unhandledRejection", async (error) => {
  console.error(error);
  await cerrar();
  process.exit(1);
});

/** El Chromium de Playwright; si no está descargado para esta versión, uno
 * ya instalado (`E2E_CHROMIUM`, el mismo que usa `npm run e2e`, o el de
 * `/opt/pw-browsers/chromium` de los entornos en la nube). */
async function abrirChromium() {
  try {
    return await chromium.launch();
  } catch (error) {
    const ruta = process.env.E2E_CHROMIUM ?? "/opt/pw-browsers/chromium";
    try {
      return await chromium.launch({ executablePath: ruta, args: ["--no-sandbox"] });
    } catch {
      throw error;
    }
  }
}

// ── Revisiones dentro de la página ──
/** Elementos que se salen por la derecha (sin contar los que viven dentro de
 * un contenedor con scroll horizontal propio, como las filas de chips) y
 * controles de menos de 32 px en pantallas táctiles. */
function revisar() {
  const ancho = document.documentElement.clientWidth;
  const describir = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const clase = typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
    const texto = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${clase}${texto ? ` «${texto}»` : ""}`;
  };
  const dentroDeScroll = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") return true;
    }
    return false;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };

  const desbordes = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (!visible(el) || el.closest("dialog:not([open])")) continue;
    const r = el.getBoundingClientRect();
    if (r.right > ancho + 1 && !dentroDeScroll(el)) desbordes.push(`${describir(el)} (llega a ${Math.round(r.right)} px)`);
  }

  const chicos = [];
  if (matchMedia("(pointer: coarse)").matches) {
    const controles = document.querySelectorAll("a[href], button, select, input:not([type=hidden]), textarea, [role=button], summary");
    for (const el of controles) {
      if (!visible(el) || el.closest("dialog:not([open])") || el.closest(".sr-only")) continue;
      // Un enlace dentro de un párrafo se toca por su renglón: no cuenta.
      if (el.tagName === "A" && el.closest("p, li > p, .prose")) continue;
      // Una casilla dentro de su etiqueta se toca por la etiqueta entera.
      const objetivo = el.matches("input[type=checkbox], input[type=radio]") && el.closest("label") ? el.closest("label") : el;
      const r = objetivo.getBoundingClientRect();
      if (Math.min(r.width, r.height) < 32) chicos.push(`${describir(el)} (${Math.round(r.width)}×${Math.round(r.height)})`);
    }
  }
  return { desbordes: [...new Set(desbordes)].slice(0, 8), chicos: [...new Set(chicos)].slice(0, 12), totalChicos: chicos.length, anchoPagina: document.documentElement.scrollWidth, ancho };
}

// ── Capturas ──
await rm(salida, { recursive: true, force: true });
await mkdir(salida, { recursive: true });
await esperar(`${urlBase}/${idioma}/login`);

const navegador = await abrirChromium();
const reporte = [];
const nombreArchivo = (...partes) => partes.join("__").replace(/[^a-z0-9_.-]+/gi, "-").replace(/-+/g, "-") + ".jpg";

for (const tema of temas) {
  cambiarTema(tema);
  for (const modo of modos) {
    for (const nombre of nombresDispositivos) {
      const info = dispositivo(nombre);
      for (const variante of variantes) {
        const contexto = await navegador.newContext({
          ...info.opciones,
          viewport: { width: info.opciones.viewport.width, height: alto(info, variante) },
          colorScheme: modo === "oscuro" ? "dark" : "light",
          locale: idioma === "en" ? "en-US" : "es-ES",
        });
        const pagina = await contexto.newPage();
        const errores = [];
        pagina.on("pageerror", (e) => errores.push(e.message));

        for (const ruta of rutas) {
          const publica = RUTAS_PUBLICAS.includes(ruta);
          await contexto.clearCookies();
          if (!publica) await contexto.addCookies([cookieSesion(new URL(urlBase).hostname)]);
          if (publica && tema !== temas[0]) continue; // las de acceso no cambian con el tema
          try {
            await pagina.goto(`${urlBase}/${idioma}${ruta}`, { waitUntil: "networkidle", timeout: 120_000 });
          } catch (error) {
            reporte.push({ tema, modo, dispositivo: nombre, variante, ruta, error: String(error) });
            continue;
          }
          await pagina.addStyleTag({ content: "nextjs-portal{display:none!important} *{caret-color:transparent!important}" });
          if (variante === "teclado") {
            // Solo campos que abren el teclado (no casillas, colores ni archivos).
            const campo = pagina
              .locator(
                "input:not([type=hidden], [type=checkbox], [type=radio], [type=file], [type=color], [type=range], [type=button], [type=submit]):visible, textarea:visible, [contenteditable=true]:visible",
              )
              .first();
            // Sin campos de texto no se abre el teclado: esa captura no
            // corresponde (antes salía igual, con la barra de abajo a la vista).
            if (!(await campo.count())) continue;
            await campo.focus().catch(() => {});
          }
          await pagina.waitForTimeout(500);
          const revision = await pagina.evaluate(revisar);
          const archivo = nombreArchivo(tema, modo, variante, ruta.slice(1) || "inicio", nombre);
          await pagina.screenshot({ path: path.join(salida, archivo), type: "jpeg", quality: 82 });
          reporte.push({ tema, modo, dispositivo: nombre, variante, ruta, archivo, ...revision, errores: [...errores] });
          errores.length = 0;
        }
        await contexto.close();
      }
      process.stdout.write(".");
    }
  }
}
await navegador.close();
await cerrar();
console.log();

// ── Hojas: una por pantalla, con todos los dispositivos lado a lado ──
const ALTO_HOJA = 760;
const hojas = [];
const grupos = new Map();
for (const fila of reporte.filter((f) => f.archivo)) {
  const clave = [fila.tema, fila.modo, fila.variante, fila.ruta].join(" · ");
  if (!grupos.has(clave)) grupos.set(clave, []);
  grupos.get(clave).push(fila);
}
for (const [clave, filas] of grupos) {
  const piezas = await Promise.all(
    filas.map(async (fila) => {
      const imagen = sharp(path.join(salida, fila.archivo));
      const { width, height } = await imagen.metadata();
      const escala = Math.min(1, ALTO_HOJA / height);
      const w = Math.round(width * escala), h = Math.round(height * escala);
      return { datos: await imagen.resize(w, h).toBuffer(), w, h, fila };
    }),
  );
  const ancho = piezas.reduce((suma, p) => suma + p.w + 16, 16);
  const composicion = [];
  let x = 16;
  for (const p of piezas) {
    const marca = p.fila.desbordes.length ? "#e0245e" : p.fila.totalChicos ? "#e8a33d" : "#2f9e6e";
    const etiqueta = `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="40"><rect width="100%" height="100%" fill="${marca}"/><text x="8" y="26" font-size="15" font-family="sans-serif" fill="#fff">${p.fila.dispositivo} · ${p.fila.ancho}px${p.fila.desbordes.length ? " · DESBORDE" : ""}${p.fila.totalChicos ? ` · ${p.fila.totalChicos} chicos` : ""}</text></svg>`;
    composicion.push({ input: Buffer.from(etiqueta), left: x, top: 8 }, { input: p.datos, left: x, top: 52 });
    x += p.w + 16;
  }
  const archivo = nombreArchivo("hoja", clave);
  await sharp({ create: { width: ancho, height: ALTO_HOJA + 68, channels: 3, background: "#30283a" } })
    .composite(composicion)
    .jpeg({ quality: 80 })
    .toFile(path.join(salida, archivo));
  hojas.push({ clave, archivo, filas });
}

// ── index.html y reporte ──
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Capturas responsive</title>
<style>body{margin:0;padding:16px;background:#1d1824;color:#f3eef7;font:14px/1.4 system-ui,sans-serif}h2{margin:32px 0 8px;font-size:16px}
.fila{display:flex;gap:16px;overflow-x:auto;padding-bottom:8px}figure{margin:0;flex:none}img{display:block;height:640px;width:auto;border:1px solid #554a63}
figcaption{padding:4px 0;font-size:12px}.mal{color:#ff7aa2}.ojo{color:#f5c26b}ul{margin:4px 0;padding-left:18px;font-size:12px;max-width:420px}</style>
<h1>Capturas responsive</h1><p>${escapar(new Date().toLocaleString("es"))} · ${reporte.filter((f) => f.archivo).length} capturas. Rojo: algo se sale de la pantalla. Amarillo: controles de menos de 32 px.</p>
${hojas
  .map(
    (h) => `<h2>${escapar(h.clave)}</h2><div class="fila">${h.filas
      .map(
        (f) => `<figure><a href="${f.archivo}"><img src="${f.archivo}" loading="lazy" alt=""></a><figcaption>${escapar(f.dispositivo)} · ${f.ancho}px
${f.desbordes.length ? `<ul class="mal">${f.desbordes.map((d) => `<li>${escapar(d)}</li>`).join("")}</ul>` : ""}
${f.chicos.length ? `<ul class="ojo">${f.chicos.map((d) => `<li>${escapar(d)}</li>`).join("")}</ul>` : ""}
${f.errores.length ? `<ul class="mal">${f.errores.map((d) => `<li>Error: ${escapar(d)}</li>`).join("")}</ul>` : ""}</figcaption></figure>`,
      )
      .join("")}</div>`,
  )
  .join("")}`;
await writeFile(path.join(salida, "index.html"), html);
await writeFile(path.join(salida, "reporte.json"), JSON.stringify(reporte, null, 2));

// ── Resumen en la terminal ──
const conDesborde = reporte.filter((f) => f.desbordes?.length);
const conChicos = reporte.filter((f) => f.totalChicos);
const conError = reporte.filter((f) => f.error || f.errores?.length);
console.log(`${reporte.filter((f) => f.archivo).length} capturas en ${path.relative(process.cwd(), salida)}/ (abrir index.html)`);
console.log(`Desborde horizontal: ${conDesborde.length}${conDesborde.length ? "\n" + conDesborde.map((f) => `  ${f.tema} ${f.modo} ${f.dispositivo} ${f.ruta}: ${f.desbordes[0]}`).join("\n") : ""}`);
console.log(`Pantallas con controles de menos de 32 px: ${conChicos.length}`);
if (conError.length) console.log(`Errores: ${conError.length}\n${conError.map((f) => `  ${f.dispositivo} ${f.ruta}: ${f.error ?? f.errores[0]}`).join("\n")}`);
