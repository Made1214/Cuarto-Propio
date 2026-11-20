import { getTranslations } from "next-intl/server";
import { ArribaAlRecargar, CargarMas, FinDeLista } from "@/components/cargar-mas";
import {
  CLASE_CHIP,
  CLASE_CHIP_ACTIVO,
  CLASE_CHIP_INACTIVO,
  FiltroCategoria,
} from "@/components/filtro-categoria";
import { Link } from "@/i18n/navigation";
import { listarConFiltroCategoria } from "@/lib/categorias/filtro";
import { listarHashtags, listarImagenes, TAMANO_PAGINA_VITRINA } from "@/lib/imagenes/queries";
import { ExhibirPiezas } from "./exhibir-piezas";
import { IconoVitrina } from "./iconos";
import { VentanaImagen } from "./ventana-imagen";

type Carga = "prioritaria" | "inmediata" | "diferida";

/** En el celular (una columna) la primera pantalla muestra una o dos piezas:
 * esas van con prioridad alta. */
const PRIORITARIAS_EN_UNA_COLUMNA = 2;

/** De 1 a 4 columnas cubre del celular a una laptop de 1440 px. En una
 * pantalla más ancha (5 o 6 columnas) las de arriba de las últimas columnas
 * esperan al primer dibujado, como antes — y a cambio el celular no baja de
 * entrada fotos que quedan muy abajo. */
const COLUMNAS_POSIBLES = [2, 3, 4];

/** Medidas aproximadas de una ventanita, en px de CSS, para estimar dónde
 * corta cada columna: el ancho típico de la columna, la barra de arriba con
 * sus bordes, el renglón del título y el margen entre ventanas. */
const ANCHO_COLUMNA = 260;
const ALTO_BARRA = 34;
const ALTO_TITULO = 38;
const MARGEN = 20;

/**
 * Qué piezas de la primera tanda se piden apenas llega el HTML.
 *
 * Antes eran las cuatro primeras, pensadas para el celular. Pero con columnas
 * CSS el orden corre de arriba abajo POR COLUMNA: en escritorio esas cuatro
 * caían todas en la primera, y las que encabezan las otras columnas —tan a
 * la vista como la primera— quedaban en `lazy`, que no se pide hasta que el
 * navegador termina de dibujar la página. Eso era parte de los marcos vacíos
 * del principio.
 *
 * El ancho de la pantalla no se sabe en el servidor, así que se calcula para
 * cada cantidad de columnas posible dónde empieza cada columna y se marcan
 * todas esas cabeceras. Las columnas CSS se equilibran por ALTO, no por
 * cantidad (con fotos apaisadas y verticales mezcladas, la columna 2 no
 * empieza en la pieza n/2), así que se simula el equilibrado con la
 * proporción de cada foto: el alto mínimo de columna con el que todo entra en
 * esa cantidad de columnas, y dónde corta cada una con ese alto. No tiene que
 * ser exacto: si se equivoca por una, esa pieza vuelve a lo de antes (se pide
 * al dibujarse).
 */
function cargasDeLaPrimeraTanda(
  piezas: { titulo: string | null; ancho: number | null; alto: number | null }[],
): Carga[] {
  const cargas: Carga[] = piezas.map((_, indice) =>
    indice < PRIORITARIAS_EN_UNA_COLUMNA ? "prioritaria" : "diferida",
  );

  const altos = piezas.map(
    (pieza) =>
      ALTO_BARRA +
      ANCHO_COLUMNA * (pieza.ancho && pieza.alto ? pieza.alto / pieza.ancho : 1) +
      (pieza.titulo?.trim() ? ALTO_TITULO : 0) +
      MARGEN,
  );

  for (const columnas of COLUMNAS_POSIBLES) {
    for (const inicio of iniciosDeColumna(altos, columnas)) {
      if (cargas[inicio] === "diferida") cargas[inicio] = "inmediata";
    }
  }
  return cargas;
}

/** Índices donde empieza cada columna (sin contar la primera) al repartir
 * `altos` en `columnas` columnas equilibradas. */
function iniciosDeColumna(altos: number[], columnas: number): number[] {
  // Con un alto de columna dado, llenar en orden y saltar de columna cuando
  // la siguiente pieza ya no entra (`break-inside: avoid`: ninguna se parte).
  const repartir = (altoColumna: number) => {
    const inicios: number[] = [];
    let ocupado = 0;
    altos.forEach((alto, indice) => {
      if (ocupado > 0 && ocupado + alto > altoColumna) {
        inicios.push(indice);
        ocupado = 0;
      }
      ocupado += alto;
    });
    return inicios;
  };

  // Búsqueda binaria del alto mínimo con el que todo entra en `columnas`.
  let bajo = Math.max(0, ...altos);
  let alto = altos.reduce((suma, valor) => suma + valor, 0);
  for (let vuelta = 0; vuelta < 30 && alto - bajo > 1; vuelta++) {
    const medio = (bajo + alto) / 2;
    if (repartir(medio).length + 1 <= columnas) alto = medio;
    else bajo = medio;
  }
  return repartir(alto);
}

export default async function VitrinaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hashtag?: string; categoria?: string; hasta?: string }>;
}) {
  const { locale } = await params;
  const { hashtag, categoria: categoriaUrl, hasta } = await searchParams;
  const t = await getTranslations({ locale, namespace: "vitrina" });

  const [{ categorias, categoriaActual, resultado: pagina }, hashtags] = await Promise.all([
    listarConFiltroCategoria(categoriaUrl, (categoriaId) =>
      // El total solo se cuenta si se va a mostrar, o sea, al filtrar.
      listarImagenes({ hashtag, categoriaId, hasta, contar: Boolean(hashtag || categoriaId) }),
    ),
    listarHashtags(),
  ]);

  // Solo la categoría que de verdad existe: un id roto en la URL se trata
  // como si no hubiera filtro (ver `listarConFiltroCategoria`).
  const categoria = categoriaActual?.id;
  const hayFiltro = Boolean(hashtag || categoria);
  const imagenes = pagina.filas;
  // Lo que hay que conservar al tocar el OTRO filtro, para que elegir un
  // hashtag no borre la categoría elegida y viceversa. Ninguno lleva
  // `hasta`: cambiar de filtro vuelve a la primera tanda.
  const soloCategoria: Record<string, string> = categoria ? { categoria } : {};
  const soloHashtag: Record<string, string> = hashtag ? { hashtag } : {};

  // La pared va en bloques de una tanda cada uno, cada bloque con sus propias
  // columnas. Con columnas CSS el orden corre de arriba abajo por columna y
  // el navegador las equilibra: si todas las piezas compartieran un solo
  // bloque, sumar una tanda redistribuiría la pared entera —las piezas que
  // estaban al pie de la columna 2 pasarían a la mitad de la 1— y lo que se
  // estaba mirando cambiaría de lugar justo al cargar. Así, cada tanda se
  // apila debajo y lo ya visto no se mueve. El precio es una costura apenas
  // despareja entre bloques (cada uno termina con sus columnas a distinta
  // altura), que en el celular —una sola columna— ni existe. Resolverlo del
  // todo pediría un masonry por JavaScript que mida el ancho, y eso trae un
  // salto al hidratar en cada carga de la página.
  const bloques: (typeof imagenes)[] = [];
  for (let inicio = 0; inicio < imagenes.length; inicio += TAMANO_PAGINA_VITRINA) {
    bloques.push(imagenes.slice(inicio, inicio + TAMANO_PAGINA_VITRINA));
  }
  const cargasPrimeraTanda = cargasDeLaPrimeraTanda(bloques[0] ?? []);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Recargar vuelve arriba (y a la primera tanda: ver `paginar`). */}
      <ArribaAlRecargar />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tema-titulo font-diario text-4xl font-bold text-secondary-purple">{t("titulo")}</h1>
          <p className="mt-1 text-sm text-muted/70">{t("subtitulo")}</p>
        </div>

        <ExhibirPiezas />
      </div>

      {/* Dos filas de chips con el mismo aspecto: la categoría (compartida
          con los otros módulos) y debajo los hashtags, la etiqueta fina
          propia de la Vitrina. */}
      <FiltroCategoria
        pathname="/vitrina"
        categorias={categorias}
        categoriaActualId={categoria ?? null}
        conservar={soloHashtag}
      />

      {hashtags.length > 0 ? (
        <nav aria-label={t("filtrarHashtag")} className="tema-fila-chips -mx-5 -mt-3 sm:mx-0">
          <ul className="fila-deslizable flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {hashtags.map((etiqueta) => {
              const activo = etiqueta.nombre === hashtag;
              return (
                <li key={etiqueta.nombre}>
                  <Link
                    // Tocar el hashtag ya activo lo apaga: el chip es el
                    // interruptor, no hay que buscar otro lugar para quitarlo.
                    href={{
                      pathname: "/vitrina",
                      query: activo
                        ? soloCategoria
                        : { ...soloCategoria, hashtag: etiqueta.nombre },
                    }}
                    aria-current={activo ? "page" : undefined}
                    className={`${CLASE_CHIP} ${activo ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO}`}
                  >
                    #{etiqueta.nombre}
                    <span className="tabular-nums opacity-60">{etiqueta.cantidad}</span>
                    {activo ? <span aria-hidden="true">✕</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {hayFiltro ? (
        <p className="-mt-2 text-sm text-muted/80">
          <span className="font-semibold tabular-nums">
            {t("resultados", { cantidad: pagina.total ?? imagenes.length })}
          </span>
          {" · "}
          <Link href="/vitrina" className="font-semibold text-secondary-purple underline-offset-2 hover:underline">
            {t("limpiarFiltros")}
          </Link>
        </p>
      ) : null}

      {imagenes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-(length:--borde) border-dashed border-ink/40 bg-card/30 px-6 py-12 text-center">
          <span className="text-secondary-purple">
            <IconoVitrina />
          </span>
          <p className="text-muted/70">{hayFiltro ? t("sinResultados") : t("vacio")}</p>
          {hayFiltro ? (
            <Link
              href="/vitrina"
              className="boton"
            >
              {t("limpiarFiltros")}
            </Link>
          ) : (
            <ExhibirPiezas />
          )}
        </div>
      ) : (
        /* Columnas CSS (masonry) como en Listas: cada ventana ocupa el alto de
           su foto y la siguiente se acomoda justo debajo, sin recortar ni
           dejar huecos — que es lo que hace que una cuadrícula estilo
           Pinterest se vea como tal. Un bloque de columnas por tanda (ver
           `bloques` arriba). */
        <div className="flex flex-col">
          {bloques.map((bloque, indiceBloque) => (
            <div
              // Un bloque ES su posición (la tanda 1, la 2…): la clave por
              // índice es la correcta acá, y adentro cada pieza va por id.
              key={indiceBloque}
              className="columns-[15rem] gap-5 lg:columns-[17rem]"
            >
              {bloque.map((imagen, indice) => (
                <div key={imagen.id} className="mb-5 break-inside-avoid">
                  <VentanaImagen
                    locale={locale}
                    imagen={imagen}
                    // Solo el primer bloque puede verse sin scrollear; los
                    // de más abajo esperan a acercarse a la pantalla.
                    carga={indiceBloque === 0 ? cargasPrimeraTanda[indice] : "diferida"}
                  />
                </div>
              ))}
            </div>
          ))}

          {pagina.siguiente ? (
            <div className="mt-1">
              <CargarMas
                pathname="/vitrina"
                query={{ ...soloCategoria, ...soloHashtag, hasta: pagina.siguiente }}
              />
            </div>
          ) : pagina.conCursor ? (
            // `conCursor` y no el `hasta` de la URL: después de una recarga
            // el servidor lo descarta (ver `paginar`) y lo que se ve es la
            // primera tanda, donde el "no hay más" sobraría.
            <div className="mt-1">
              <FinDeLista />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
