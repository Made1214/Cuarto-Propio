import { getTranslations } from "next-intl/server";

type Seccion = { titulo: string; texto: string };

/** Pinta un documento legal guardado en los mensajes (`legal.terminos` o
 * `legal.privacidad`), así el texto vive traducido igual que el resto. */
export async function DocumentoLegal({
  locale,
  documento,
}: {
  locale: string;
  documento: "terminos" | "privacidad";
}) {
  const t = await getTranslations({ locale, namespace: "legal" });
  const secciones = t.raw(`${documento}.secciones`) as Seccion[];

  return (
    <article className="flex flex-col gap-6">
      <header>
        <h1 className="font-diario text-4xl font-bold text-secondary-purple">
          {t(`${documento}.titulo`)}
        </h1>
        <p className="mt-2 text-sm text-muted/80">{t("actualizado")}</p>
      </header>
      <p className="font-diario text-lg leading-relaxed">
        {t(`${documento}.intro`)}
      </p>
      {secciones.map((seccion) => (
        <section key={seccion.titulo} className="flex flex-col gap-2">
          <h2 className="font-diario text-xl font-semibold">
            {seccion.titulo}
          </h2>
          <p className="leading-relaxed whitespace-pre-line">{seccion.texto}</p>
        </section>
      ))}
    </article>
  );
}
