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
import { listarHashtags, listarImagenes } from "@/lib/imagenes/queries";
import { ExhibirPiezas } from "./exhibir-piezas";
import { IconoVitrina } from "./iconos";
import { RecordarPosicionVitrina } from "./posicion-vitrina";
import { ParedMasonry } from "./pared-masonry";
import { VentanaImagen } from "./ventana-imagen";

type Carga = "prioritaria" | "inmediata" | "diferida";

/**
 * Qué piezas se piden apenas llega el HTML. La pared reparte las piezas en
 * orden de lectura (cada una a la columna más corta: `ParedMasonry`), así
 * que las primeras son siempre las de arriba, tenga la pantalla las columnas
 * que tenga: las primeras cuatro con prioridad alta (dos filas en el
 * celular), hasta la décima sin esperar a que se dibuje la página, y el
 * resto cuando se acercan a la pantalla.
 */
function cargaDe(indice: number): Carga {
  if (indice < 4) return "prioritaria";
  if (indice < 10) return "inmediata";
  return "diferida";
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

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-6">
      {/* Recargar vuelve arriba (y a la primera tanda: ver `paginar`). */}
      <ArribaAlRecargar />
      <RecordarPosicionVitrina />
      <div className="encabezado-seccion">
        <h1 className="tema-titulo titulo-seccion">{t("titulo")}</h1>
        <div className="acciones-seccion">
          <ExhibirPiezas />
        </div>
        <p className="subtitulo-seccion">{t("subtitulo")}</p>
      </div>

      {/* Categorías (compartidas con los otros módulos) y, en la misma
          fila, los hashtags: la etiqueta fina propia de la Vitrina. En el
          celular es un solo carril que se desliza; desde tablet se
          acomodan en varias líneas. */}
      <FiltroCategoria
        pathname="/vitrina"
        categorias={categorias}
        categoriaActualId={categoria ?? null}
        conservar={soloHashtag}
      >
        {hashtags.length === 0 ? null : hashtags.map((etiqueta) => {
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
      </FiltroCategoria>

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
        /* La pared estilo Pinterest (ver `ParedMasonry`): todas las tandas
           en una sola pared, porque el reparto es incremental y sumar una
           tanda solo agrega abajo. */
        <div className="flex flex-col gap-2.5 sm:gap-4">
          <ParedMasonry
            medidas={imagenes.map((imagen) => ({
              proporcion: imagen.ancho && imagen.alto ? imagen.alto / imagen.ancho : 1,
              conTitulo: Boolean(imagen.titulo?.trim()),
            }))}
          >
            {imagenes.map((imagen, indice) => (
              <VentanaImagen key={imagen.id} locale={locale} imagen={imagen} carga={cargaDe(indice)} />
            ))}
          </ParedMasonry>

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
