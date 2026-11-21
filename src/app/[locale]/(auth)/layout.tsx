import { Suspense } from "react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import marca from "@/assets/logo/marca.webp";
import { Link } from "@/i18n/navigation";
import { ControlesAcceso } from "./controles";
import { ModulosMarquee } from "./modulos-marquee";

/**
 * El marco de las pantallas de acceso (entrar, crear cuenta, recuperar y
 * restablecer contraseña): a la izquierda —arriba en el celular— la marca y
 * qué es Cuarto Propio, para quien llega por primera vez; a la derecha el
 * formulario de turno.
 */
export default async function AccesoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "login" });

  return (
    <main id="contenido" className="flex flex-1 flex-col bg-background text-foreground md:flex-row">
      {/* En el celular el panel es solo una barra (marca + idioma + modo):
          antes ocupaba media pantalla y el botón de entrar quedaba abajo del
          pliegue. Desde tablet vuelve a ser la columna con qué es la app.
          En el celular queda pegada arriba (como la barra de la app): si no,
          al abrir el teclado el contenido sube por detrás de la barra de
          estado de iOS y se ve difuminado. */}
      <section className="acceso-panel sticky top-0 z-30 flex md:static flex-col gap-4 border-b-(length:--borde-grueso) border-ink bg-secondary-purple px-4 py-2 text-background md:w-[min(35rem,45%)] md:gap-7 md:border-r-(length:--borde-grueso) md:border-b-0 md:px-14 md:py-16">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label={t("volverInicio")} className="flex min-h-11 items-center gap-2.5">
            <Image
              src={marca}
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 rounded-theme border-(length:--borde) border-ink object-cover md:h-10 md:w-10"
            />
            <span className="font-pixel text-sm tracking-wide md:text-base">
              CUARTO PROPIO
            </span>
          </Link>
          <Suspense fallback={null}>
            <ControlesAcceso />
          </Suspense>
        </div>
        {/* Lema y cintas van juntos y centrados en lo que sobra de alto: así
            el espacio libre se reparte arriba y abajo en vez de quedar todo
            amontonado sobre el aviso de privacidad. */}
        <div className="hidden flex-col gap-7 md:my-auto md:flex">
          <p className="font-diario text-4xl leading-tight font-bold">
            {t("lema")}
          </p>
          {/* Lo que se puede hacer adentro: los cuatro módulos y, debajo, los
              detalles, en dos cintas que pasan en sentidos contrarios. */}
          <div className="-mx-14 flex flex-col gap-2">
            <ModulosMarquee locale={locale} />
          </div>
        </div>
        <p className="hidden items-center gap-2 self-start rounded-full border-(length:--borde) border-background/30 bg-background/10 px-3.5 py-1.5 text-[13px] md:inline-flex">
          <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          {t("privado")}
        </p>
      </section>

      <div className="flex flex-1 items-center justify-center px-5 py-6 md:px-6 md:py-8">
        <div className="flex w-full max-w-100 flex-col gap-8">
          {children}
          <nav
            aria-label={t("documentos")}
            className="flex gap-4 text-[13px] text-muted/80"
          >
            <Link
              href="/terminos"
              className="inline-flex min-h-11 items-center underline-offset-2 hover:underline"
            >
              {t("terminos")}
            </Link>
            <Link
              href="/privacidad"
              className="inline-flex min-h-11 items-center underline-offset-2 hover:underline"
            >
              {t("privacidad")}
            </Link>
          </nav>
        </div>
      </div>
    </main>
  );
}
