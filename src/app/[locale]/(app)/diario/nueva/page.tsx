import { getTranslations } from "next-intl/server";
import { crearEntrada } from "@/lib/diario/actions";
import { listarCategorias } from "@/lib/categorias/queries";
import { EntradaForm } from "../entrada-form";
import { BarraEntrada } from "../barra-entrada";
import { EstadoGuardado, GuardadoProvider, GuardarBoton } from "../guardar-boton";

export default async function NuevaEntradaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "diario" });
  const categorias = await listarCategorias();
  const crear = crearEntrada.bind(null, locale);

  const formId = "entrada-form";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <GuardadoProvider>
        <article className="border-(length:--borde) border-ink rounded-theme bg-card shadow-marco">
          <BarraEntrada
            volverHref="/diario"
            volverTexto={t("volver")}
            estado={<EstadoGuardado />}
            acciones={<GuardarBoton formId={formId} className="boton boton-verde" />}
            formatoId={`${formId}-formato`}
          />
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <h1 className="rotulo">{t("queEstasPensando")}</h1>
            <EntradaForm formId={formId} claveBorrador="nueva" action={crear} categorias={categorias} />
          </div>
        </article>
      </GuardadoProvider>
    </div>
  );
}
