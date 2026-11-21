import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArribaAlRecargar } from "@/components/cargar-mas";
import { Hueso } from "@/components/esqueleto";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import { listarCategorias } from "@/lib/categorias/queries";
import { FONDO_MIENTRAS_CARGA } from "@/lib/imagenes/fondo-carga";
import { listarRelacionadas, obtenerImagenPorCodigo } from "@/lib/imagenes/queries";
import { textoAlternativo } from "@/lib/imagenes/hashtags";
import type { ImagenEnVitrina } from "@/lib/imagenes/types";
import { BotonesVentana, IconoLapiz } from "../iconos";
import { VolverAVitrina } from "../posicion-vitrina";
import { ParedMasonry } from "../pared-masonry";
import { VentanaImagen } from "../ventana-imagen";
import { FotoFicha } from "./foto-ficha";

/**
 * Alto máximo de la foto. En `svh` (no `vh`) para que en el celular no la
 * tape la barra del navegador, y con lugar de sobra para el encabezado de
 * la app y la barra de la ventana: la pieza se tiene que ver entera sin
 * scrollear.
 *
 * El mismo valor alimenta el alto de la imagen y el ancho máximo de su
 * columna, así que vive en una constante en vez de repetido en dos lados.
 */
const ALTO_FOTO = "68svh";

/**
 * La ficha de una pieza: se mira, no se edita. Editar es un acto aparte y
 * tiene su propia pantalla (el lápiz de arriba) — así abrir una pieza para
 * verla no pone por delante un formulario, y ningún cambio se dispara sin
 * haberlo pedido.
 */
export default async function ImagenPage({
  params,
}: {
  params: Promise<{ locale: string; codigo: string }>;
}) {
  const { locale, codigo } = await params;

  const [t, format, categorias, imagen] = await Promise.all([
    getTranslations({ locale, namespace: "vitrina" }),
    getFormatter({ locale }),
    listarCategorias(),
    obtenerImagenPorCodigo(codigo),
  ]);

  if (!imagen) {
    notFound();
  }

  // Se piden de una sola vez y se reparten en dos lugares: unas pocas en la
  // columna de al lado (para saltar de pieza en pieza sin bajar) y el resto
  // debajo, que es donde termina la mirada cuando la ventana ya se miró —y
  // donde antes quedaba un vacío del alto de la columna.
  //
  // Sin `await`: la promesa se comparte entre los dos lugares, cada uno
  // dentro de su `Suspense`. Antes la ficha entera esperaba a las
  // relacionadas (tres consultas más su firma) para mandar la foto, que es
  // lo que se vino a ver; ahora la foto sale primero y las relacionadas
  // llegan por streaming. Si fallan, la ficha se queda sin ellas en vez de
  // caerse entera.
  const relacionadas = listarRelacionadas(imagen, 16).catch((fallo: unknown) => {
    console.error("No se pudieron traer las piezas relacionadas", fallo);
    return [] as ImagenEnVitrina[];
  });
  // La columna de la foto no puede ser más ancha que la foto misma cuando
  // llega a su alto máximo. Con este tope, la caja mide siempre exactamente
  // lo que mide la imagen —sea vertical, cuadrada o apaisada— y nunca queda
  // aire a los costados; lo que sobra se lo lleva el panel de datos.
  const proporcion = imagen.ancho && imagen.alto ? imagen.ancho / imagen.alto : null;
  const titulo = imagen.titulo?.trim() || t("sinTitulo");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      {/* Recargar la ficha la muestra desde arriba, no donde había quedado.
          Abrirla desde la cuadrícula ya empieza arriba: eso lo hace Next al
          navegar, porque la ficha no está a la vista desde la posición de
          scroll de la cuadrícula. */}
      <ArribaAlRecargar />
      {/* Vuelve a la pared con los filtros y el scroll con que se la dejó. */}
      <VolverAVitrina texto={t("volver")} />

      {/* En pantalla ancha la columna de relacionadas va POSICIONADA sobre
          el alto de la ventana (no como una columna más de la fila): así el
          alto lo fija siempre la ventana y la columna se recorta o scrollea
          sola. Como columna normal, una foto apaisada —ventana baja— dejaba
          un vacío enorme a su derecha. En el celular vuelve a ser una fila
          común, debajo de la ventana. */}
      <div className="flex flex-col gap-5 lg:relative lg:block">
        <Suspense fallback={<RelacionadasAlCostadoCargando />}>
          <RelacionadasAlCostado locale={locale} relacionadas={relacionadas} />
        </Suspense>

        <div className="order-1 min-w-0 border-(length:--borde) border-ink rounded-theme bg-card shadow-marco lg:ml-52 xl:ml-60">
          <div className="flex items-center gap-2 border-b-(length:--borde) border-ink bg-secondary-purple px-3 py-2 text-background">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {titulo}
            </span>
            <Link
              href={`/vitrina/${imagen.codigo}/editar`}
              aria-label={t("editar")}
              title={t("editar")}
              className="flex h-9 w-9 shrink-0 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-primary-green text-ink-strong transition-[filter] hover:brightness-90 sm:h-7 sm:w-7"
            >
              <IconoLapiz />
            </Link>
            <BotonesVentana />
          </div>

          {/* La foto y sus datos, lado a lado. La foto ocupa exactamente lo
              suyo (de ahí el tope de ancho por proporción) y el panel se
              queda con todo lo que sobre: así no hay aire ni alrededor de la
              imagen ni al costado de la ventana, con cualquier foto. */}
          <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,auto)_minmax(17rem,1fr)]">
            <div
              className="mx-auto flex w-full min-w-0 items-center justify-center bg-background"
              style={proporcion ? { maxWidth: `calc(${ALTO_FOTO} * ${proporcion})` } : undefined}
            >
              {imagen.completaUrl ? (
                <FotoFicha
                  completaUrl={imagen.completaUrl}
                  // La miniatura de fondo solo calza si se conoce la
                  // proporción real (estirada a la caja de la foto).
                  miniaturaUrl={proporcion ? imagen.miniaturaUrl : null}
                  alt={textoAlternativo(imagen.titulo, imagen.descripcion, t("sinTitulo"))}
                  ancho={imagen.ancho ?? 1200}
                  alto={imagen.alto ?? 1200}
                  altoMaximo={ALTO_FOTO}
                />
              ) : (
                <p className="py-16 text-center apoyo">
                  {t("noSePudoCargar")}
                </p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-3 border-t-(length:--borde) border-ink p-4 lg:border-t-0 lg:border-l-(length:--borde)">
              <h1 className="font-diario text-2xl font-bold text-secondary-purple">{titulo}</h1>

              {imagen.descripcion?.trim() ? (
                <p className="text-sm leading-relaxed whitespace-pre-line">{imagen.descripcion}</p>
              ) : null}

              {/* Tocar un hashtag o la categoría lleva a la vitrina ya
                  filtrada: es la forma natural de decir "más como esta". */}
              {imagen.hashtags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {imagen.hashtags.map((hashtag) => (
                    <Link
                      key={hashtag}
                      href={{ pathname: "/vitrina", query: { hashtag } }}
                      className="inline-flex min-h-9 items-center border-(length:--borde) border-ink-strong rounded-theme bg-secondary-turquoise px-2.5 text-[13px] font-semibold text-ink-strong transition-[filter] hover:brightness-95 pointer-coarse:min-h-10"
                    >
                      #{hashtag}
                    </Link>
                  ))}
                </div>
              ) : null}

              {imagen.categoriaId && imagen.categoriaNombre ? (
                <Link
                  href={{ pathname: "/vitrina", query: { categoria: imagen.categoriaId } }}
                  className="inline-flex min-h-9 w-fit items-center border-(length:--borde) border-ink-strong rounded-theme px-2.5 text-[13px] font-semibold text-ink-strong transition-[filter] hover:brightness-95 pointer-coarse:min-h-10"
                  style={{ background: colorCategoria(categorias, imagen.categoriaId) }}
                >
                  {imagen.categoriaNombre}
                </Link>
              ) : null}

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t-(length:--borde) border-ink/20 pt-3">
                <span className="text-[13px] font-semibold text-muted/70">
                  {format.dateTime(new Date(imagen.fecha), { dateStyle: "long" })}
                </span>
                {imagen.completaUrl ? (
                  <a
                    href={imagen.completaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="boton boton-chico"
                  >
                    {t("verCompleta")}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sin esqueleto propio: está debajo de la ventana, fuera de la
          primera pantalla casi siempre, y aparecer sola ahí no mueve nada
          de lo que se está mirando. */}
      <Suspense fallback={null}>
        <RelacionadasMasAbajo locale={locale} relacionadas={relacionadas} />
      </Suspense>
    </div>
  );
}

/** Cuántas relacionadas van en la columna de al lado; el resto, debajo. */
const AL_COSTADO = 6;

/** Las clases de la columna de al lado, compartidas con su esqueleto para
 * que al llegar las de verdad no se mueva nada. */
const CLASES_COSTADO =
  "order-2 flex shrink-0 flex-col gap-2 lg:absolute lg:inset-y-0 lg:left-0 lg:w-48 lg:overflow-y-auto lg:pr-1 xl:w-56";

async function RelacionadasAlCostado({
  locale,
  relacionadas,
}: {
  locale: string;
  relacionadas: Promise<ImagenEnVitrina[]>;
}) {
  const [t, todas] = await Promise.all([
    getTranslations({ locale, namespace: "vitrina" }),
    relacionadas,
  ]);
  const alCostado = todas.slice(0, AL_COSTADO);
  if (alCostado.length === 0) return null;

  return (
    <aside className={CLASES_COSTADO}>
      <h2 className="rotulo">
        {t("relacionadas")}
      </h2>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-1">
        {alCostado.map((otra) => (
          <Link
            key={otra.id}
            href={`/vitrina/${otra.codigo}`}
            title={otra.titulo ?? undefined}
            className="block border-(length:--borde) border-ink rounded-theme bg-background shadow-marco-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            {otra.miniaturaUrl ? (
              <Image
                src={otra.miniaturaUrl}
                alt={textoAlternativo(otra.titulo, otra.descripcion, t("sinTitulo"))}
                width={otra.ancho ?? 400}
                height={otra.alto ?? 400}
                unoptimized
                placeholder={FONDO_MIENTRAS_CARGA}
                className="aspect-square h-auto w-full object-cover"
              />
            ) : (
              <span className="block aspect-square" />
            )}
          </Link>
        ))}
      </div>
    </aside>
  );
}

/** Mientras llegan las relacionadas, la columna de al lado se esboza igual
 * que en el `loading.tsx` de la ficha. */
function RelacionadasAlCostadoCargando() {
  return (
    <div aria-hidden="true" className={CLASES_COSTADO}>
      <Hueso className="h-2.5 w-24" />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-1">
        {Array.from({ length: AL_COSTADO }, (_, indice) => (
          <div key={indice} className="border-(length:--borde) border-ink rounded-theme bg-background shadow-marco-sm">
            <Hueso className="aspect-square w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function RelacionadasMasAbajo({
  locale,
  relacionadas,
}: {
  locale: string;
  relacionadas: Promise<ImagenEnVitrina[]>;
}) {
  const [t, todas] = await Promise.all([
    getTranslations({ locale, namespace: "vitrina" }),
    relacionadas,
  ]);
  const masAbajo = todas.slice(AL_COSTADO);
  if (masAbajo.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="rotulo">
        {t("masComoEsta")}
      </h2>
      <ParedMasonry
        medidas={masAbajo.map((otra) => ({
          proporcion: otra.ancho && otra.alto ? otra.alto / otra.ancho : 1,
          conTitulo: Boolean(otra.titulo?.trim()),
        }))}
      >
        {masAbajo.map((otra) => (
          <VentanaImagen key={otra.id} locale={locale} imagen={otra} />
        ))}
      </ParedMasonry>
    </section>
  );
}
