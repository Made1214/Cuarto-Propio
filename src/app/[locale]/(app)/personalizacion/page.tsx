import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { obtenerConfigTema } from "@/lib/temas/queries";
import { EditorPersonalizacion } from "./editor-personalizacion";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "personalizacion" });
  return { title: `${t("titulo")} · Cuarto Propio` };
}

/**
 * Personalización: tema, colores, tipografía, cursor e iconos. Una pantalla
 * propia y no el panel de perfil, porque hace falta lugar para ver cada
 * opción antes de elegirla. Cada cambio se guarda solo y se ve en el acto.
 */
export default async function PersonalizacionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, config] = await Promise.all([
    getTranslations({ locale, namespace: "personalizacion" }),
    obtenerConfigTema(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="tema-titulo font-diario text-4xl font-bold text-secondary-purple">{t("titulo")}</h1>
        <p className="mt-1 text-sm text-muted/80">{t("subtitulo")}</p>
      </div>
      <EditorPersonalizacion config={config} />
    </div>
  );
}
