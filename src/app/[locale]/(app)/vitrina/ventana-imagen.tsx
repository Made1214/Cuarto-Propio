import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FONDO_MIENTRAS_CARGA } from "@/lib/imagenes/fondo-carga";
import { textoAlternativo } from "@/lib/imagenes/hashtags";
import type { ImagenEnVitrina } from "@/lib/imagenes/types";

/**
 * Las columnas del esqueleto de la pared (`loading.tsx`): las mismas
 * cantidades que `ParedMasonry` —dos en el celular, más a medida que hay
 * lugar—, con el mismo espacio entre ventanas.
 */
export const CLASE_PARED =
  "columns-2 gap-2.5 sm:columns-3 sm:gap-4 lg:columns-4 2xl:columns-5";
export const CLASE_PIEZA_PARED = "mb-2.5 break-inside-avoid sm:mb-4";

/**
 * Una pieza de la pared, al estilo de un tablero de imágenes: la foto manda,
 * con un marco fino, y el título corto debajo, fuera del marco. Antes cada
 * pieza era una ventanita de escritorio con barra "_ □ ×" y caja de título:
 * la pared se veía como un escritorio lleno de ventanas y el marco le
 * quitaba lugar a la foto.
 *
 * Debajo de la foto va el título y nada más: los hashtags y la categoría
 * son para buscar, y buscar se hace desde la barra de filtros de arriba —
 * repetirlos en cada tarjeta llenaba la pared de texto y le robaba el
 * protagonismo a las imágenes, que es justo lo contrario de lo que hace
 * que una cuadrícula así se vea bien.
 */
export async function VentanaImagen({
  locale,
  imagen,
  carga = "diferida",
}: {
  locale: string;
  imagen: ImagenEnVitrina;
  /**
   * Cuándo pedir la foto:
   * - `prioritaria`: de las primeras que se ven sin scrollear; se pide ya y
   *   antes que todo lo demás.
   * - `inmediata`: puede verse sin scrollear según el ancho de pantalla; se
   *   pide apenas llega el HTML, sin esperar a que se dibuje la página, y el
   *   navegador le sube la prioridad si de verdad quedó a la vista.
   * - `diferida`: todas las demás, que esperan a acercarse a la pantalla.
   */
  carga?: "prioritaria" | "inmediata" | "diferida";
}) {
  const t = await getTranslations({ locale, namespace: "vitrina" });
  const titulo = imagen.titulo?.trim() ?? "";

  return (
    <Link href={`/vitrina/${imagen.codigo}`} className="group block rounded-theme">
      {/* El alto ya está reservado (ancho y alto en el <img>) y el degradé
          ocupa el lugar mientras baja: la pared no salta al cargar. */}
      <div className="overflow-hidden border-(length:--borde) border-ink rounded-theme bg-background transition-[transform,box-shadow] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-marco group-focus-visible:-translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:shadow-marco">
        {imagen.miniaturaUrl ? (
          <Image
            src={imagen.miniaturaUrl}
            alt={textoAlternativo(titulo, imagen.descripcion, t("sinTitulo"))}
            width={imagen.ancho ?? 800}
            height={imagen.alto ?? 800}
            // Sin el optimizador de Next a propósito: `sharp` ya dejó esta
            // miniatura en WebP al ancho de la cuadrícula (600 px; las piezas
            // de antes, 800 — ver `MINIATURAS` en procesar.ts), así que volver a
            // procesarla no la mejora y sí gasta cuota de transformaciones.
            // Además la URL viene firmada y se renueva cada pocas horas
            // (ver `src/lib/storage/firmas.ts`), así que el optimizador
            // guardaría versiones que dejan de servir enseguida.
            unoptimized
            // `priority` está deprecado desde Next 16 y `preload` metería un
            // <link> en el <head> por pieza; la doc recomienda esto. Sin
            // `sizes`: con `unoptimized` no hay `srcset` entre el que elegir,
            // y Next lo descarta.
            loading={carga === "diferida" ? "lazy" : "eager"}
            fetchPriority={carga === "prioritaria" ? "high" : undefined}
            // El degradé suave mientras baja (y se va solo al terminar).
            placeholder={FONDO_MIENTRAS_CARGA}
            className="h-auto w-full"
          />
        ) : (
          <p className="px-3 py-10 text-center apoyo text-xs">
            {t("noSePudoCargar")}
          </p>
        )}
      </div>

      {titulo ? (
        // Dos renglones como mucho: un título largo no estira la pieza.
        <p className="mt-1.5 line-clamp-2 px-0.5 text-[13px] leading-snug font-semibold break-words text-foreground sm:text-sm">
          {titulo}
        </p>
      ) : null}
    </Link>
  );
}
