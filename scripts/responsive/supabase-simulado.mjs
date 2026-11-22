// Un Supabase de mentira, solo para mirar la app con sesión sin tocar la base
// real: responde lo justo de Auth, PostgREST y Storage con datos de prueba
// (30 piezas de proporciones variadas, entradas, listas, audios). Lo usa
// `capturas.mjs`; también sirve suelto para `npm run dev` apuntando acá:
//
//   node scripts/responsive/supabase-simulado.mjs
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=x npm run dev
//
// Escribir (guardar una entrada, marcar un ítem) "funciona" pero no persiste,
// salvo el tema: `GET /__tema?preset=void` cambia el tema activo, y un
// cambio desde Personalización también queda.
//
// No es una base de verdad: los filtros son aproximados y no hay RLS.

import http from "node:http";
import sharp from "sharp";

export const PUERTO = Number(process.env.PUERTO_SUPABASE ?? 54321);
export const UID = "11111111-1111-4111-8111-111111111111";

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

/** JWT de la cuenta de prueba (HS256 sin firma válida: `getClaims` lo manda
 * a `/auth/v1/user`, que acá dice que sí). */
export const JWT = [
  b64url({ alg: "HS256", typ: "JWT" }),
  b64url({ sub: UID, email: "prueba@cuarto.propio", role: "authenticated", aud: "authenticated", exp: 4102444800, iat: 1700000000, session_id: "s" }),
  "ZmlybWFh",
].join(".");

const usuario = { id: UID, email: "prueba@cuarto.propio", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };

/** La cookie de sesión que espera `@supabase/ssr` para esta URL. */
export function cookieSesion(dominio = "localhost") {
  const sesion = { access_token: JWT, refresh_token: "r", expires_in: 3600, expires_at: 4102444800, token_type: "bearer", user: usuario };
  return { name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify(sesion)).toString("base64url"), domain: dominio, path: "/" };
}

// ── Datos de prueba ──
const categorias = [
  { id: uuid(901), nombre: "viajes", created_at: "2026-01-01T00:00:00Z" },
  { id: uuid(902), nombre: "dibujos", created_at: "2026-01-02T00:00:00Z" },
  { id: uuid(903), nombre: "lecturas", created_at: "2026-01-03T00:00:00Z" },
  { id: uuid(904), nombre: "una categoría de nombre largo", created_at: "2026-01-04T00:00:00Z" },
];
const cat = (i) => (i == null ? null : { id: categorias[i].id, nombre: categorias[i].nombre });

const medidas = [[1200, 1600], [1600, 1200], [1200, 1200], [1000, 1800], [1600, 900], [1200, 1500], [900, 1600], [1400, 1000]];
const etiquetas = [["arte", "rosa"], ["viaje"], ["arte"], ["gato", "arte"], [], ["rosa", "noche"], ["noche"], ["viaje", "mar"]];
const imagenes = Array.from({ length: 30 }, (_, i) => {
  const [w, h] = medidas[i % medidas.length];
  return {
    id: uuid(100 + i),
    codigo: `pz${i}`,
    titulo: i % 3 === 2 ? null : i % 4 === 0 ? `Atardecer en la playa con un título bastante largo ${i}` : `Pieza ${i}`,
    descripcion: i % 2 ? "Una descripción de la pieza, con algo de texto para ver cómo se acomoda." : null,
    hashtags: etiquetas[i % etiquetas.length],
    categoria_id: i % 3 ? categorias[i % 3].id : null,
    categoria: i % 3 ? cat(i % 3) : null,
    miniatura_path: `${UID}/${w}x${h}-${i}-m.webp`,
    completa_path: `${UID}/${w}x${h}-${i}-c.webp`,
    ancho: w,
    alto: h,
    fecha: new Date(Date.UTC(2026, 10, 20, 12) - i * 36e5 * 7).toISOString(),
  };
});

const parrafo = (texto) => ({ type: "paragraph", content: [{ type: "text", text: texto }] });
const entradas = Array.from({ length: 7 }, (_, i) => ({
  id: uuid(200 + i),
  codigo: `en${i}`,
  titulo: i === 0 ? "Prueba de testeo con un título que ocupa dos renglones" : `Entrada ${i}`,
  contenido: {
    type: "doc",
    content: [
      parrafo("Tengo 23 años, he estado indagando en la maravilla de escribir, de soñar despierta y de mirar por la ventana."),
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Un subtítulo" }] },
      parrafo("Otro párrafo para que la entrada tenga algo de largo y se vea cómo corre el texto en la pantalla."),
    ],
  },
  contenido_texto: "Tengo 23 años, he estado indagando en la maravilla de escribir, de soñar despierta.",
  fecha: new Date(Date.UTC(2026, 10, 20 - i * 4, 15)).toISOString(),
  categoria_id: i % 2 ? categorias[i % 3].id : null,
  categoria: i % 2 ? cat(i % 3) : null,
}));

const items = (base, filas) => filas.map(([contenido, marcado], orden) => ({ id: uuid(base + orden), contenido, marcado, orden }));
const listas = [
  { id: uuid(301), codigo: "li1", nombre: "Libros leídos", categoria_id: categorias[2].id, con_casillas: true, categoria: cat(2), created_at: "2026-11-01T00:00:00Z",
    items_lista: items(400, [["Un cuarto propio", true], ["Orlando", false], ["Las olas", false], ["La señora Dalloway, edición anotada con prólogo largo", false]]) },
  { id: uuid(302), codigo: "li2", nombre: "Disfraces que quiero hacer", categoria_id: null, con_casillas: false, categoria: null, created_at: "2026-10-01T00:00:00Z",
    items_lista: items(410, [["Alas de mariposa", false], ["Hada del bosque", false]]) },
  { id: uuid(303), codigo: "li3", nombre: "Vacía", categoria_id: null, con_casillas: true, categoria: null, created_at: "2026-09-01T00:00:00Z", items_lista: [] },
];

const audios = Array.from({ length: 4 }, (_, i) => ({
  id: uuid(500 + i),
  titulo: i ? `Audio — ${15 - i} nov, 3:4${i}pm` : "Pensamientos de la mañana",
  categoria_id: i % 2 ? categorias[1].id : null,
  categoria: i % 2 ? cat(1) : null,
  archivo_path: `${UID}/a${i}.webm`,
  duracion_segundos: 30 + i * 95,
  fecha: new Date(Date.UTC(2026, 10, 18 - i, 10)).toISOString(),
}));

const tema = { id: uuid(600), preset: "retro", colores: null, tipografia: null, cursor: null, iconos: null };
const perfil = { id: UID, nombre: "Prueba", foto_perfil_path: null, bienvenida_vista_en: "2026-01-01T00:00:00Z", tema_activo_id: tema.id };
const tablas = { imagenes, entradas, listas, audios, categorias };

// ── PostgREST aproximado ──
function filtrar(filas, consulta) {
  let salida = filas;
  for (const [campo, valor] of consulta) {
    const m = /^(eq|neq|cs|is|lt|lte|gt|gte|in)\.(.*)$/.exec(valor);
    if (!m || ["select", "order", "limit", "offset"].includes(campo)) continue;
    const [, op, v] = m;
    salida = salida.filter((fila) => {
      const x = fila[campo];
      switch (op) {
        case "eq": return String(x) === v;
        case "neq": return String(x) !== v;
        case "is": return v === "null" ? x == null : true;
        case "cs": return v.replace(/[{}]/g, "").split(",").every((t) => (x ?? []).includes(t));
        case "lt": return String(x) < v;
        case "lte": return String(x) <= v;
        case "gt": return String(x) > v;
        case "gte": return String(x) >= v;
        case "in": return v.replace(/[()]/g, "").split(",").includes(String(x));
        default: return true;
      }
    });
  }
  if ((consulta.get("order") ?? "").startsWith("fecha")) salida = [...salida].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const limite = consulta.get("limit");
  return limite ? salida.slice(0, Number(limite)) : salida;
}

// ── Imágenes de prueba: degradés numerados, con la proporción de cada pieza ──
const cacheImagenes = new Map();
async function imagen(ruta) {
  const m = /(\d+)x(\d+)-(\d+)-(m|c)/.exec(ruta) ?? [0, 800, 800, 0, "m"];
  const [w, h, i, version] = [Number(m[1]), Number(m[2]), Number(m[3]), m[4]];
  const clave = `${w}-${h}-${i}-${version}`;
  if (cacheImagenes.has(clave)) return cacheImagenes.get(clave);
  const escala = version === "m" ? 600 / w : 1;
  const W = Math.round(w * escala), H = Math.round(h * escala), tono = (i * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="hsl(${tono},60%,70%)"/><stop offset="1" stop-color="hsl(${(tono + 80) % 360},50%,40%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${W / 2}" cy="${H / 2}" r="${Math.min(W, H) / 4}" fill="rgba(255,255,255,.35)"/><text x="50%" y="52%" font-size="${W / 8}" text-anchor="middle" fill="#fff" font-family="sans-serif">${i}</text></svg>`;
  const datos = await sharp(Buffer.from(svg)).webp().toBuffer();
  cacheImagenes.set(clave, datos);
  return datos;
}

function leerCuerpo(pedido) {
  return new Promise((resolver) => {
    let datos = "";
    pedido.on("data", (trozo) => (datos += trozo));
    pedido.on("end", () => {
      try {
        resolver(datos ? JSON.parse(datos) : null);
      } catch {
        resolver(null);
      }
    });
  });
}

export function iniciarSupabaseSimulado({ puerto = PUERTO, presetInicial } = {}) {
  if (presetInicial) tema.preset = presetInicial;
  const servidor = http.createServer(async (pedido, respuesta) => {
    const url = new URL(pedido.url, `http://127.0.0.1:${puerto}`);
    const ruta = url.pathname;
    const json = (cuerpo, codigo = 200, extra = {}) => {
      respuesta.writeHead(codigo, { "content-type": "application/json", ...extra });
      respuesta.end(JSON.stringify(cuerpo));
    };

    if (ruta === "/__tema") {
      tema.preset = url.searchParams.get("preset") ?? tema.preset;
      return json({ preset: tema.preset });
    }
    if (ruta.startsWith("/auth/v1/.well-known")) return json({ keys: [] });
    if (ruta === "/auth/v1/user") return json(usuario);
    if (ruta.startsWith("/auth/v1/token")) return json({ access_token: JWT, refresh_token: "r", expires_in: 3600, expires_at: 4102444800, token_type: "bearer", user: usuario });
    if (ruta.startsWith("/auth/v1/")) return json({});

    if (ruta.startsWith("/storage/v1/object/sign/")) {
      if (pedido.method === "POST") {
        const cuerpo = await leerCuerpo(pedido);
        const bucket = ruta.split("/")[5];
        if (cuerpo?.paths) return json(cuerpo.paths.map((p) => ({ path: p, signedURL: `/object/sign/${bucket}/${p}?token=t`, error: null })));
        return json({ signedURL: `/object/sign/${bucket}/x?token=t` });
      }
      if (ruta.endsWith(".webm")) {
        respuesta.writeHead(404);
        return respuesta.end();
      }
      const datos = await imagen(ruta);
      respuesta.writeHead(200, { "content-type": "image/webp", "cache-control": "max-age=3600" });
      return respuesta.end(datos);
    }
    if (ruta.startsWith("/storage/v1/")) return json({});
    if (ruta.startsWith("/rest/v1/rpc/")) return json(ruta.endsWith("uso_storage") ? 123456789 : null);

    if (ruta.startsWith("/rest/v1/")) {
      const tabla = ruta.split("/")[3];
      const unico = (pedido.headers.accept ?? "").includes("vnd.pgrst.object");
      if (pedido.method !== "GET" && pedido.method !== "HEAD") {
        const cuerpo = await leerCuerpo(pedido);
        if (tabla === "temas" && pedido.method === "PATCH" && cuerpo) Object.assign(tema, cuerpo);
        return json(unico ? cuerpo ?? {} : cuerpo ? [].concat(cuerpo) : [], 201);
      }
      let filas;
      if (tabla === "perfiles") filas = [(url.searchParams.get("select") ?? "").includes("temas") ? { temas: tema } : perfil];
      else if (tabla === "temas") filas = [tema];
      else filas = filtrar(tablas[tabla] ?? [], url.searchParams);
      const encabezados = { "content-range": `0-${Math.max(0, filas.length - 1)}/${filas.length}` };
      if (unico) return filas.length ? json(filas[0], 200, encabezados) : json({ code: "PGRST116", message: "no rows" }, 406);
      return json(filas, 200, encabezados);
    }
    json({});
  });
  return new Promise((resolver) => servidor.listen(puerto, "127.0.0.1", () => resolver(servidor)));
}

/** Cambia el tema activo del Supabase simulado. */
export function cambiarTema(preset) {
  tema.preset = preset;
}

// Suelto (`node supabase-simulado.mjs`): levanta el servidor y se queda.
if (import.meta.url === `file://${process.argv[1]}`) {
  await iniciarSupabaseSimulado();
  console.log(`Supabase simulado en http://127.0.0.1:${PUERTO}`);
}
