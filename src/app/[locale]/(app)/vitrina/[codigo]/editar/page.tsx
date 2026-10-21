import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listarCategorias } from "@/lib/categorias/queries";
import { eliminarImagen } from "@/lib/imagenes/actions";
import { obtenerImagenPorCodigo } from "@/lib/imagenes/queries";
import { BotonesVentana, IconoVolver } from "../../iconos";
import { EliminarImagenBoton } from "./eliminar-imagen-boton";
import { FormularioImagen } from "./formulario-imagen";

/** Editar una pieza: su propia pantalla, con la foto al lado como
 * referencia (chica, porque acá lo que se mira es el texto). */
export default async function EditarImagenPage({
  params,
}: {
  params: Promise<{ locale: string; codigo: string }>;
}) {
  const { locale, codigo } = await params;

  const [t, categorias, imagen] = await Promise.all([
    getTranslations({ locale, namespace: "vitrina" }),
    listarCategorias(),
    obtenerImagenPorCodigo(codigo),
  ]);

  if (!imagen) {
    notFound();
  }

  const titulo = imagen.titulo?.trim() || t("sinTitulo");
  const eliminar = eliminarImagen.bind(null, locale, imagen.id);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Link
        href={`/vitrina/${imagen.codigo}`}
        className="flex w-fit items-center gap-2 font-pixel text-xs tracking-wide text-muted/70 transition-colors hover:text-secondary-purple"
      >
        <IconoVolver />
        {t("volverPieza").toUpperCase()}
      </Link>

      <div className="border-2 border-ink bg-card shadow-[5px_5px_0_var(--ink)]">
        <div className="flex items-center gap-2 border-b-2 border-ink bg-secondary-purple px-3 py-2 text-background">
          <span className="min-w-0 flex-1 truncate font-pixel text-xs tracking-wide">
            {t("editandoPieza", { titulo })}
          </span>
          <BotonesVentana />
        </div>

        <div className="flex flex-col sm:flex-row">
          <div className="shrink-0 border-b-2 border-ink bg-background p-3 sm:w-48 sm:border-b-0 sm:border-r-2">
            {imagen.miniaturaUrl ? (
              <Image
                src={imagen.miniaturaUrl}
                alt={titulo}
                width={imagen.ancho ?? 800}
                height={imagen.alto ?? 800}
                unoptimized
                className="mx-auto h-auto w-full max-w-48 border-2 border-ink"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <FormularioImagen
              locale={locale}
              imagen={imagen}
              categorias={categorias}
              acciones={<EliminarImagenBoton action={eliminar} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
