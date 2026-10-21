import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import { listarCategorias } from "@/lib/categorias/queries";
import { listarRelacionadas, obtenerImagenPorCodigo } from "@/lib/imagenes/queries";
import { BotonesVentana, IconoLapiz, IconoVolver } from "../iconos";
import { VentanaImagen } from "../ventana-imagen";

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
  const relacionadas = await listarRelacionadas(imagen, 16);
  const alCostado = relacionadas.slice(0, 6);
  const masAbajo = relacionadas.slice(6);
  // La columna de la foto no puede ser más ancha que la foto misma cuando
  // llega a su alto máximo. Con este tope, la caja mide siempre exactamente
  // lo que mide la imagen —sea vertical, cuadrada o apaisada— y nunca queda
  // aire a los costados; lo que sobra se lo lleva el panel de datos.
  const proporcion = imagen.ancho && imagen.alto ? imagen.ancho / imagen.alto : null;
  const titulo = imagen.titulo?.trim() || t("sinTitulo");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Link
        href="/vitrina"
        className="flex w-fit items-center gap-2 font-pixel text-xs tracking-wide text-muted/70 transition-colors hover:text-secondary-purple"
      >
        <IconoVolver />
        {t("volver").toUpperCase()}
      </Link>

      {/* En pantalla ancha la columna de relacionadas va POSICIONADA sobre
          el alto de la ventana (no como una columna más de la fila): así el
          alto lo fija siempre la ventana y la columna se recorta o scrollea
          sola. Como columna normal, una foto apaisada —ventana baja— dejaba
          un vacío enorme a su derecha. En el celular vuelve a ser una fila
          común, debajo de la ventana. */}
      <div className="flex flex-col gap-5 lg:relative lg:block">
        {alCostado.length > 0 ? (
          <aside className="order-2 flex shrink-0 flex-col gap-2 lg:absolute lg:inset-y-0 lg:left-0 lg:w-48 lg:overflow-y-auto lg:pr-1 xl:w-56">
            <h2 className="font-pixel text-[0.625rem] tracking-wide text-muted/70">
              {t("relacionadas").toUpperCase()}
            </h2>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-1">
              {alCostado.map((otra) => (
                <Link
                  key={otra.id}
                  href={`/vitrina/${otra.codigo}`}
                  title={otra.titulo ?? undefined}
                  className="block border-2 border-ink bg-background shadow-[3px_3px_0_var(--ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  {otra.miniaturaUrl ? (
                    <Image
                      src={otra.miniaturaUrl}
                      alt={otra.titulo ?? t("sinTitulo")}
                      width={otra.ancho ?? 400}
                      height={otra.alto ?? 400}
                      unoptimized
                      className="aspect-square h-auto w-full object-cover"
                    />
                  ) : (
                    <span className="block aspect-square" />
                  )}
                </Link>
              ))}
            </div>
          </aside>
        ) : null}

        <div className="order-1 min-w-0 border-2 border-ink bg-card shadow-[5px_5px_0_var(--ink)] lg:ml-52 xl:ml-60">
          <div className="flex items-center gap-2 border-b-2 border-ink bg-secondary-purple px-3 py-2 text-background">
            <span className="min-w-0 flex-1 truncate font-pixel text-xs tracking-wide">
              {titulo}
            </span>
            <Link
              href={`/vitrina/${imagen.codigo}/editar`}
              aria-label={t("editar")}
              title={t("editar")}
              className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-ink bg-primary-green text-ink-strong transition-[filter] hover:brightness-90"
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
                <Image
                  src={imagen.completaUrl}
                  alt={titulo}
                  width={imagen.ancho ?? 1200}
                  height={imagen.alto ?? 1200}
                  // Igual que en la cuadrícula: la versión que sirve Storage
                  // ya salió del pipeline de `sharp`, y la URL firmada cambia
                  // en cada carga, así que el optimizador no aportaría nada.
                  unoptimized
                  priority
                  style={{ maxHeight: ALTO_FOTO }}
                  className="h-auto w-auto max-w-full object-contain"
                />
              ) : (
                <p className="py-16 text-center font-pixel text-xs text-muted/60">
                  {t("noSePudoCargar").toUpperCase()}
                </p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-3 border-t-2 border-ink p-4 lg:border-t-0 lg:border-l-2">
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
                      className="border-2 border-ink-strong bg-secondary-turquoise px-1.5 py-0.5 font-pixel text-[0.625rem] tracking-wide text-ink-strong transition-[filter] hover:brightness-95"
                    >
                      #{hashtag}
                    </Link>
                  ))}
                </div>
              ) : null}

              {imagen.categoriaId && imagen.categoriaNombre ? (
                <Link
                  href={{ pathname: "/vitrina", query: { categoria: imagen.categoriaId } }}
                  className="w-fit border-2 border-ink-strong px-2 py-1 font-pixel text-[0.625rem] tracking-wide text-ink-strong transition-[filter] hover:brightness-95"
                  style={{ background: colorCategoria(categorias, imagen.categoriaId) }}
                >
                  {imagen.categoriaNombre.toUpperCase()}
                </Link>
              ) : null}

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t-2 border-ink/20 pt-3">
                <span className="font-pixel text-[0.625rem] tracking-wide text-muted/70">
                  {format.dateTime(new Date(imagen.fecha), { dateStyle: "long" }).toUpperCase()}
                </span>
                {imagen.completaUrl ? (
                  <a
                    href={imagen.completaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-ink bg-card px-2 py-0.5 font-pixel text-[0.625rem] tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
                  >
                    {t("verCompleta").toUpperCase()}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {masAbajo.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-pixel text-[0.625rem] tracking-wide text-muted/70">
            {t("masComoEsta").toUpperCase()}
          </h2>
          <div className="columns-[15rem] gap-5 lg:columns-[17rem]">
            {masAbajo.map((otra) => (
              <div key={otra.id} className="mb-5 break-inside-avoid">
                <VentanaImagen locale={locale} imagen={otra} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
