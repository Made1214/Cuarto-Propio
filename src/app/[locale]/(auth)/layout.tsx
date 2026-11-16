import { Suspense } from "react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import marca from "@/assets/logo/marca.webp";
import { Link } from "@/i18n/navigation";
import { ControlesAcceso } from "./controles";

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

  const modulos = [
    { clave: "diario", fondo: "bg-primary-pink text-ink-strong" },
    { clave: "listas", fondo: "bg-card text-ink" },
    { clave: "vitrina", fondo: "bg-secondary-turquoise text-ink-strong" },
    { clave: "audio", fondo: "bg-primary-green text-ink-strong" },
  ] as const;

  return (
    <main id="contenido" className="flex flex-1 flex-col bg-background text-foreground md:flex-row">
      {/* En el celular el panel es solo una barra (marca + idioma + modo):
          antes ocupaba media pantalla y el botón de entrar quedaba abajo del
          pliegue. Desde tablet vuelve a ser la columna con qué es la app. */}
      <section className="flex flex-col gap-4 border-b-(length:--borde-grueso) border-ink bg-secondary-purple px-4 py-2 text-background md:w-[min(35rem,45%)] md:gap-7 md:border-r-(length:--borde-grueso) md:border-b-0 md:px-14 md:py-16">
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
        <p className="hidden font-diario text-4xl leading-tight font-bold md:block">
          {t("lema")}
        </p>
        <ul className="mt-2 hidden grid-cols-2 gap-3.5 md:grid">
          {modulos.map(({ clave, fondo }) => (
            <li
              key={clave}
              className={`flex flex-col gap-1.5 border-(length:--borde) border-ink rounded-theme p-4 shadow-marco ${fondo}`}
            >
              <span className="text-[15px] font-bold">
                {t(`modulo.${clave}`)}
              </span>
              <span className="text-[13px]">{t(`modulo.${clave}Ayuda`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-auto hidden text-[13px] opacity-90 md:block">
          {t("privado")}
        </p>
      </section>

      <div className="flex flex-1 justify-center px-5 py-6 md:items-center md:px-6 md:py-8">
        <div className="flex w-full max-w-100 flex-col gap-8">
          {children}
          <nav
            aria-label={t("documentos")}
            className="flex gap-4 text-[13px] text-muted/80"
          >
            <Link
              href="/terminos"
              className="underline-offset-2 hover:underline"
            >
              {t("terminos")}
            </Link>
            <Link
              href="/privacidad"
              className="underline-offset-2 hover:underline"
            >
              {t("privacidad")}
            </Link>
          </nav>
        </div>
      </div>
    </main>
  );
}
