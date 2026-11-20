import { headers } from "next/headers";

/**
 * Paginación por cursor (keyset) para los listados cronológicos: Diario,
 * Vitrina y Audio. Orden siempre `fecha desc, id desc` — el `id` desempata
 * dos filas con la misma fecha (pasa con piezas exhibidas en el mismo
 * instante), así el orden es total y ninguna fila se repite ni se saltea
 * entre una página y la siguiente.
 *
 * Por qué la profundidad vive en la URL (`?hasta=<cursor>`) y no en una
 * lista que se acumula en el cliente:
 *
 * - El servidor siempre renderiza TODO lo que se ve, así que `refresh()`
 *   (las actions de Audio) y `router.refresh()` (grabar, exhibir) devuelven
 *   la pantalla entera al día. Con páginas acumuladas en el cliente, una nota
 *   de la página 3 renombrada o borrada seguiría mostrándose vieja, y su
 *   estado optimista "volvería" al dato viejo al terminar la transición.
 * - Lo mismo al volver desde otra pantalla (borrar una pieza redirige a la
 *   Vitrina): la caché de navegación de Next puede restaurar el estado de
 *   cliente de la página, con páginas acumuladas que ya no son verdad.
 * - Cambiar un filtro arma una URL nueva sin `hasta`: se vuelve sola a la
 *   primera página, sin lógica de "resetear".
 * - Volver con "atrás" desde una ficha deja a la usuaria a la misma
 *   profundidad, con el scroll donde estaba (lo restaura el navegador).
 *
 * Recargar, en cambio, vuelve a la primera tanda y arriba de todo: la
 * usuaria no quiere que una recarga la deje enterrada donde había llegado.
 * Por eso `paginar` descarta el cursor cuando la página se pide como
 * DOCUMENTO (recarga, enlace abierto en otra pestaña, volver a la app desde
 * otro sitio): esas cargas mandan `Sec-Fetch-Dest: document`, mientras que
 * todo lo que pasa dentro de la app —"cargar más", "atrás", `refresh()`,
 * `router.refresh()`— viaja como pedido RSC por `fetch` (`Sec-Fetch-Dest:
 * empty`) y sí respeta el cursor. Del lado del cliente, `cargar-mas.tsx`
 * borra de la URL el `hasta` que el servidor ignoró (si quedara, el próximo
 * `refresh()` lo volvería a aplicar) y lleva el scroll arriba.
 *
 * El costo: cada "cargar más" vuelve a pedir y renderizar lo ya visto. A esta
 * escala (cientos de elementos, no millones) es poco, y nunca es peor que
 * antes, cuando cada carga traía el archivo entero; las URLs firmadas de lo
 * ya visto salen del caché de `src/lib/storage/firmas.ts`.
 *
 * Qué significa `hasta`: el cursor de la ÚLTIMA fila que ya se vio. La
 * página muestra todo lo que va de lo más nuevo hasta esa fila inclusive,
 * más una página nueva por debajo. Por eso son dos consultas en paralelo, no
 * una: "desde lo más nuevo hasta el cursor" (sin límite) y "una página por
 * debajo del cursor". Anclar en una fila —y no en una cantidad— hace que lo
 * visible no cambie si mientras tanto se agrega algo arriba (aparece una
 * fila más, ninguna se cae por abajo), y sigue funcionando aunque la fila
 * del cursor se haya borrado: la comparación es por valor, no por id
 * existente.
 *
 * Índice: alcanza con el `(usuario_id, fecha desc)` que cada tabla ya tiene
 * desde 0001_esquema_completo.sql — RLS aporta el `usuario_id = auth.uid()`
 * y el cursor el rango sobre `fecha`; el desempate por `id` es un orden
 * incremental sobre grupos de una fila. Un índice con `id desc` al final
 * ahorraría ese paso, pero no vale una migración a este volumen.
 */

/** Posición de una fila en el orden `fecha desc, id desc`. `fecha` va tal
 * como la devuelve PostgREST (con microsegundos): pasarla por `Date` la
 * recortaría a milisegundos y el cursor dejaría de coincidir con la fila. */
type Cursor = { fecha: string; id: string };

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;
const FORMATO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El cursor viaja en la URL como un token opaco: así no hay que escapar los
 * `+` y `:` de la fecha, y nadie lo confunde con algo para editar a mano. */
function codificarCursor(cursor: Cursor): string {
  return Buffer.from(`${cursor.fecha}|${cursor.id}`).toString("base64url");
}

/** Lee el token de la URL. Cualquier cosa rara —un enlace viejo, uno editado
 * a mano— vale como "sin cursor" (primera página) en vez de romper. La
 * validación estricta además importa por otra razón: los valores terminan
 * dentro de un filtro `or=(...)` de PostgREST, y no pueden traer comas,
 * comillas ni paréntesis que cambien el filtro. */
function decodificarCursor(token: string | undefined): Cursor | null {
  if (!token) return null;
  const [fecha, id, sobra] = Buffer.from(token, "base64url").toString("utf8").split("|");
  if (sobra !== undefined || !fecha || !id) return null;
  if (!FORMATO_FECHA.test(fecha) || !FORMATO_ID.test(id)) return null;
  return { fecha, id };
}

/** Lo mínimo que se le pide al constructor de consultas de supabase-js. Va
 * estructural (y no con los genéricos de postgrest-js) porque el cliente de
 * la app no está tipado con el esquema de la base. */
type Consulta<Q> = {
  lte(columna: string, valor: string): Q;
  gte(columna: string, valor: string): Q;
  or(filtros: string): Q;
  limit(cantidad: number): Q;
};

/** Qué tramo del orden pedirle a la consulta. */
type Tramo =
  | { tipo: "primera"; limite: number }
  /** De lo más nuevo hasta el cursor, inclusive: lo que ya se veía. */
  | { tipo: "hasta"; cursor: Cursor }
  /** Estrictamente después del cursor: la página nueva. */
  | { tipo: "despues"; cursor: Cursor; limite: number };

/**
 * Aplica un tramo a una consulta ya ordenada por `fecha desc, id desc`.
 *
 * `(fecha, id) <= cursor` se escribe como `fecha <= f AND (fecha < f OR
 * id <= i)`: PostgREST no tiene comparación de filas, y el `fecha <= f`
 * suelto —redundante para el resultado— es lo que le deja al planificador
 * usar el índice por rango en vez de filtrar fila por fila.
 */
function aplicarTramo<Q extends Consulta<Q>>(consulta: Q, tramo: Tramo): Q {
  if (tramo.tipo === "primera") return consulta.limit(tramo.limite);

  // Comillas alrededor de la fecha: dentro de `or=(...)` el punto y los dos
  // puntos de un timestamp se podrían leer como separadores.
  const { fecha, id } = tramo.cursor;
  if (tramo.tipo === "hasta") {
    // Sin límite propio: es lo que ya se veía. Igual lo topa el `max-rows`
    // de PostgREST (1000 por defecto en Supabase) — habría que cargar más de
    // mil elementos en una sola visita para notarlo.
    return consulta.gte("fecha", fecha).or(`fecha.gt."${fecha}",id.gte.${id}`);
  }
  return consulta
    .lte("fecha", fecha)
    .or(`fecha.lt."${fecha}",id.lt.${id}`)
    .limit(tramo.limite);
}

type Respuesta = { data: unknown[] | null; error: unknown; count?: number | null };

/** El tipo de fila que devuelve una consulta (el de la respuesta exitosa). */
type FilaDe<R> = R extends { data: (infer F)[] } ? F : never;

export type Pagina<F> = {
  filas: F[];
  /** Token para el `?hasta=` del botón "cargar más"; `null` si no hay más. */
  siguiente: string | null;
  /** Cuántas filas cumplen los filtros en total (solo si se pidió contar en
   * la consulta con `count: "exact"`), para el "N resultados" de los
   * filtros: con paginación, el largo de `filas` ya no es el total. */
  total: number | null;
  /** Si se aplicó un cursor (`false` en la primera página, y también cuando
   * vino un `hasta` pero se descartó por ser una recarga): lo que decide si
   * tiene sentido el "no hay más" del final. */
  conCursor: boolean;
};

/**
 * ¿La página se está pidiendo como documento entero (recarga, enlace nuevo)
 * y no desde adentro de la app? Ver el comentario del principio.
 *
 * Si el navegador no manda el encabezado (solo pasa en navegadores viejos,
 * fuera de los que soporta la app), se respeta el cursor: es lo de siempre y
 * nunca rompe el "cargar más".
 */
async function esCargaDeDocumento(): Promise<boolean> {
  return (await headers()).get("sec-fetch-dest") === "document";
}

/**
 * Trae lo que corresponde mostrar para un `?hasta=` dado (o la primera
 * página si no hay). `consulta` arma la consulta de cada módulo —tabla,
 * columnas, filtros y orden `fecha desc, id desc`— y le aplica el tramo con
 * `aplicarTramo`; acá solo se decide qué tramos pedir y se juntan.
 */
export async function paginar<Q extends Consulta<Q> & PromiseLike<Respuesta>>({
  hasta,
  tamano,
  consulta,
}: {
  hasta: string | undefined;
  tamano: number;
  /** Devuelve una consulta NUEVA cada vez: con cursor se piden dos tramos. */
  consulta: () => Q;
}): Promise<Pagina<FilaDe<Awaited<Q>>>> {
  // Sin `hasta` no hace falta ni mirar los encabezados.
  const cursor = hasta && !(await esCargaDeDocumento()) ? decodificarCursor(hasta) : null;
  // Una fila de más para saber si hay otra página sin pedir un conteo.
  const limite = tamano + 1;

  const [vistas, tanda] = await Promise.all([
    cursor ? aplicarTramo(consulta(), { tipo: "hasta", cursor }) : null,
    aplicarTramo(
      consulta(),
      cursor ? { tipo: "despues", cursor, limite } : { tipo: "primera", limite },
    ),
  ]);
  if (vistas?.error) throw vistas.error;
  if (tanda.error) throw tanda.error;

  const siguientes = tanda.data ?? [];
  const filas = [...(vistas?.data ?? []), ...siguientes.slice(0, tamano)] as FilaDe<Awaited<Q>>[];
  const ultima = filas.at(-1) as { fecha?: unknown; id?: unknown } | undefined;
  const hayMas = siguientes.length > tamano;

  const conteos = [vistas?.count, tanda.count];
  const total = conteos.some((conteo) => typeof conteo === "number")
    ? conteos.reduce<number>((suma, conteo) => suma + (conteo ?? 0), 0)
    : null;

  return {
    filas,
    siguiente:
      hayMas && typeof ultima?.fecha === "string" && typeof ultima.id === "string"
        ? codificarCursor({ fecha: ultima.fecha, id: ultima.id })
        : null,
    total,
    conCursor: cursor !== null,
  };
}
