import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Marco simple para las páginas legales: públicas, para leer con calma,
 * sin la navegación de la app (se pueden abrir sin cuenta). */
export default async function LegalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between gap-4 border-b-(length:--borde-grueso) border-ink bg-secondary-purple px-5 md:px-8">
        <Link
          href="/"
          className="font-pixel text-sm tracking-wide text-background"
        >
          CUARTO PROPIO
        </Link>
        <nav
          aria-label={t("documentos")}
          className="flex gap-4 text-sm font-semibold text-background"
        >
          <Link href="/terminos" className="underline-offset-2 hover:underline">
            {t("terminos.titulo")}
          </Link>
          <Link
            href="/privacidad"
            className="underline-offset-2 hover:underline"
          >
            {t("privacidad.titulo")}
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-2xl px-5 py-10">{children}</main>
    </div>
  );
}
