import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { actualizarEntrada, eliminarEntrada } from "@/lib/diario/actions";
import { listarCategorias } from "@/lib/categorias/queries";
import { obtenerEntradaPorCodigo } from "@/lib/diario/queries";
import { EntradaForm } from "../../entrada-form";
import { EliminarEntradaBoton } from "../eliminar-boton";
import { BarraEntrada } from "../../barra-entrada";
import { EstadoGuardado, GuardadoProvider, GuardarBoton } from "../../guardar-boton";
import { MetaEntrada } from "../../meta-entrada";

export default async function EditarEntradaPage({
  params,
}: {
  params: Promise<{ locale: string; codigo: string }>;
}) {
  const { locale, codigo } = await params;

  const [t, categorias, entrada] = await Promise.all([
    getTranslations({ locale, namespace: "diario" }),
    listarCategorias(),
    obtenerEntradaPorCodigo(codigo),
  ]);

  if (!entrada) {
    notFound();
  }

  const actualizar = actualizarEntrada.bind(null, locale, entrada.id);
  const eliminar = eliminarEntrada.bind(null, locale, entrada.id);

  const formId = "entrada-form";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <GuardadoProvider>
        <article className="border-(length:--borde) border-ink rounded-theme bg-card shadow-marco">
          <BarraEntrada
            volverHref={`/diario/${codigo}`}
            volverTexto={t("volver")}
            estado={<EstadoGuardado />}
            acciones={
              <>
                <EliminarEntradaBoton action={eliminar} />
                <GuardarBoton formId={formId} className="boton boton-verde" />
              </>
            }
            formatoId={`${formId}-formato`}
          />
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <MetaEntrada fecha={entrada.fecha} categoriaId={entrada.categoriaId} categoriaNombre={entrada.categoriaNombre} categorias={categorias} locale={locale} />
            <EntradaForm
              formId={formId}
              claveBorrador={codigo}
              action={actualizar}
              categorias={categorias}
              valoresIniciales={{
                titulo: entrada.titulo,
                categoriaNombre: entrada.categoriaNombre,
                contenido: entrada.contenido,
              }}
            />
          </div>
        </article>
      </GuardadoProvider>
    </div>
  );
}
