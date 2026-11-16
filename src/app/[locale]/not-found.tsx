import Image from "next/image";
import { getTranslations } from "next-intl/server";
import marca from "@/assets/logo/marca.webp";
import { Link } from "@/i18n/navigation";

/** La 404 de todo el sitio: con la marca, en el idioma de la URL y con
 * salida al inicio (o al diario, para quien ya tiene sesión). */
export default async function NoEncontrado() {
  const t = await getTranslations("noEncontrado");
  const boton =
    "flex h-12 items-center justify-center border-(length:--borde) border-ink rounded-theme px-5 text-[15px] font-bold text-ink-strong shadow-marco transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none";

  return (
    <main id="contenido" className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-5 py-16 text-center text-foreground">
      <title>{`${t("meta")} · Cuarto Propio`}</title>
      <div className="border-(length:--borde-grueso) border-ink rounded-theme bg-card shadow-marco-lg">
        <div className="flex items-center justify-between gap-6 border-b-(length:--borde-grueso) border-ink bg-secondary-purple px-3 py-1.5 font-pixel text-xs text-background">
          <span>404.exe</span>
          <span aria-hidden="true">✕</span>
        </div>
        <Image src={marca} alt="" width={96} height={96} className="m-6 h-24 w-24 rounded-theme border-(length:--borde) border-ink object-cover" />
      </div>
      <h1 className="max-w-md font-diario text-3xl font-bold text-secondary-purple">{t("titulo")}</h1>
      <p className="max-w-md text-[15px] leading-relaxed text-muted/85">{t("texto")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={`${boton} bg-primary-green`}>
          {t("inicio")}
        </Link>
        <Link href="/diario" className={`${boton} bg-card`}>
          {t("diario")}
        </Link>
      </div>
    </main>
  );
}
