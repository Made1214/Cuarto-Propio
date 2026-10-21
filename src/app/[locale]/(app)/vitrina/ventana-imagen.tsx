import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ImagenEnVitrina } from "@/lib/imagenes/types";
import { BotonesVentana } from "./iconos";

/**
 * Una pieza de la cuadrícula, montada como ventanita de escritorio Y2K.
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
}: {
  locale: string;
  imagen: ImagenEnVitrina;
}) {
  const t = await getTranslations({ locale, namespace: "vitrina" });
  const titulo = imagen.titulo?.trim() ?? "";

  return (
    <Link
      href={`/vitrina/${imagen.codigo}`}
      className="block border-2 border-ink bg-card shadow-[5px_5px_0_var(--ink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--ink)] focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5"
    >
      {/* Barra de ventana sin texto: el título vive abajo, como en un
          tablero de imágenes, y acá quedan solo los botones de adorno. */}
      <div className="flex items-center justify-end gap-2 border-b-2 border-ink bg-secondary-purple px-2 py-1.5 text-background">
        <BotonesVentana />
      </div>

      <div className="bg-background">
        {imagen.miniaturaUrl ? (
          <Image
            src={imagen.miniaturaUrl}
            alt={titulo || t("sinTitulo")}
            width={imagen.ancho ?? 800}
            height={imagen.alto ?? 800}
            // Sin el optimizador de Next a propósito: `sharp` ya dejó esta
            // miniatura en WebP al ancho de la cuadrícula, así que volver a
            // procesarla no la mejora y sí gasta cuota de transformaciones.
            // Además la URL viene firmada (cambia en cada carga), así que
            // ninguna versión optimizada se reutilizaría nunca.
            unoptimized
            className="h-auto w-full"
          />
        ) : (
          <p className="px-3 py-10 text-center font-pixel text-[0.625rem] text-muted/60">
            {t("noSePudoCargar").toUpperCase()}
          </p>
        )}
      </div>

      {titulo ? (
        <p className="border-t-2 border-ink px-2.5 py-2 font-diario text-sm font-semibold text-foreground">
          {titulo}
        </p>
      ) : null}
    </Link>
  );
}
