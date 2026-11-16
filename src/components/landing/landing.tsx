import Image from "next/image";
import { getTranslations } from "next-intl/server";
import logo from "@/assets/logo/logo.webp";
import marca from "@/assets/logo/marca.webp";
import { Link } from "@/i18n/navigation";
import { DemoAudio, DemoDiario, DemoListas, DemoVitrina, Personalizador } from "./demos";
import { cormorant, pirata } from "./fuentes";
import { BotonModo, LandingRaiz, SelectorFlotante } from "./landing-raiz";
import { RUTA_LOGIN, RUTA_REGISTRO } from "./rutas";
import { VentanasHero } from "./ventanas-hero";
import "./landing.css";

/**
 * La página de bienvenida para quien todavía no entró (la raíz `/` sin
 * sesión). Todo el texto sale de `landing` en src/messages/; lo interactivo
 * (temas, ventanitas, maquetas) son islas de cliente dentro de `LandingRaiz`.
 */
export async function Landing({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "landing" });
  const otroIdioma = locale === "es" ? "en" : "es";

  const pildora = "inline-block rounded-full px-3 py-1 text-xs font-semibold text-[var(--text-primary)]";
  const tituloModulo =
    "section-title font-literary text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl";
  const descripcion = "text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base";

  return (
    <LandingRaiz
      className={`landing ${cormorant.variable} ${pirata.variable} flex min-h-full flex-1 flex-col antialiased`}
    >
      {/* ── Barra ── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[color-mix(in_srgb,var(--bg-page)_85%,transparent)] backdrop-blur-md transition-colors duration-500">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link href="/" aria-label={t("inicio")} className="group flex min-w-0 items-center gap-2.5">
            <Image
              src={marca}
              alt=""
              width={40}
              height={40}
              preload
              className="h-9 w-9 shrink-0 rounded-[30%] border-2 border-[var(--text-primary)] object-cover transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10"
            />
            <span className="font-literary hidden truncate text-lg font-semibold tracking-tight text-[var(--text-primary)] min-[400px]:inline sm:text-xl">
              {t("marca")}
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="/"
              locale={otroIdioma}
              hrefLang={otroIdioma}
              aria-label={t("cambiarIdioma")}
              className="theme-btn-secondary px-2.5 py-1.5 text-xs font-semibold"
            >
              {t("idiomaBoton")}
            </Link>
            <BotonModo />
            <Link
              href={RUTA_LOGIN}
              className="theme-btn-secondary hidden px-3.5 py-1.5 text-xs font-medium sm:inline-flex sm:text-sm"
            >
              {t("nav.login")}
            </Link>
            <Link
              href={RUTA_REGISTRO}
              className="theme-btn-primary px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap sm:px-4 sm:text-sm"
            >
              {t("nav.signup")}
            </Link>
          </div>
        </div>
      </header>

      <SelectorFlotante />

      <main>
        {/* ── Hero ── */}
        <section
          data-section-theme="whimsical"
          className="relative overflow-hidden px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-24"
        >
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
              <div className="theme-surface-alt inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                <span aria-hidden="true">✦</span>
                <span>{t("hero.badge")}</span>
              </div>
              <h1 className="hero-title font-literary text-4xl leading-[1.15] font-semibold text-[var(--text-primary)] sm:text-5xl lg:text-[3.35rem]">
                {t("hero.title")}
              </h1>
              <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg lg:mx-0">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row lg:justify-start">
                <Link
                  href={RUTA_REGISTRO}
                  className="theme-btn-primary w-full px-7 py-3.5 text-center text-sm font-semibold sm:w-auto sm:text-base"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href={RUTA_LOGIN}
                  className="theme-btn-secondary w-full px-6 py-3.5 text-center text-sm font-medium sm:w-auto sm:text-base"
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>
              <p className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] lg:justify-start">
                <span aria-hidden="true">🔒</span>
                <span>{t("hero.note")}</span>
              </p>
            </div>

            <VentanasHero />
          </div>
        </section>

        {/* ── El problema ── */}
        <section className="reveal-section px-4 py-14 sm:px-6 sm:py-20">
          <div className="theme-card mx-auto max-w-4xl space-y-8 p-6 text-center sm:p-10">
            <div className="mx-auto max-w-2xl space-y-3">
              <h2 className="section-title font-literary text-2xl font-semibold text-[var(--text-primary)] sm:text-4xl">
                {t("problem.title")}
              </h2>
              <p className={descripcion}>{t("problem.subtitle")}</p>
            </div>
            <ul className="mx-auto grid max-w-2xl grid-cols-2 gap-3 pt-2 sm:grid-cols-4 sm:gap-4">
              {(
                [
                  ["📝", "item1"],
                  ["📌", "item2"],
                  ["🖼️", "item3"],
                  ["🎙️", "item4"],
                ] as const
              ).map(([icono, clave]) => (
                <li key={clave} className="theme-surface-alt flex flex-col items-center gap-2 p-4">
                  <span aria-hidden="true" className="text-2xl">
                    {icono}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {t(`problem.${clave}`)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center gap-2 pt-1">
              <span aria-hidden="true" className="text-xl text-[var(--accent-primary)]">
                ↓
              </span>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)]">
                <span aria-hidden="true">🏠</span>
                <span>{t("problem.together")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Los cinco módulos ── */}
        <div className="mx-auto max-w-6xl space-y-16 px-4 py-8 sm:space-y-24 sm:px-6">
          <section
            data-section-theme="whimsical"
            className="reveal-section grid grid-cols-1 items-center gap-8 lg:grid-cols-12"
          >
            <div className="space-y-4 lg:col-span-5">
              <span className={`${pildora} bg-[color-mix(in_srgb,var(--accent-primary)_40%,transparent)]`}>
                {t("mod1.pill")}
              </span>
              <h2 className={tituloModulo}>{t("mod1.title")}</h2>
              <p className={descripcion}>{t("mod1.desc")}</p>
            </div>
            <div className="theme-card overflow-hidden lg:col-span-7">
              <div className="window-bar flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-semibold">{t("mod1.winTitle")}</span>
                <div aria-hidden="true" className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
                </div>
              </div>
              <DemoDiario />
            </div>
          </section>

          <section
            data-section-theme="retro"
            className="reveal-section grid grid-cols-1 items-center gap-8 lg:grid-cols-12"
          >
            <div className="theme-card order-2 overflow-hidden lg:order-1 lg:col-span-7">
              <div className="window-bar flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-semibold">{t("mod2.winTitle")}</span>
                <span aria-hidden="true" className="bg-white/20 px-1.5 text-xs">
                  _ □ ×
                </span>
              </div>
              <DemoListas />
            </div>
            <div className="order-1 space-y-4 lg:order-2 lg:col-span-5">
              <span className={`${pildora} bg-[color-mix(in_srgb,var(--accent-tertiary)_40%,transparent)]`}>
                {t("mod2.pill")}
              </span>
              <h2 className={tituloModulo}>{t("mod2.title")}</h2>
              <p className={descripcion}>{t("mod2.desc")}</p>
            </div>
          </section>

          <section
            data-section-theme="fairy"
            className="reveal-section grid grid-cols-1 items-center gap-8 lg:grid-cols-12"
          >
            <div className="space-y-4 lg:col-span-5">
              <span className={`${pildora} bg-[color-mix(in_srgb,var(--accent-secondary)_50%,transparent)]`}>
                {t("mod3.pill")}
              </span>
              <h2 className={tituloModulo}>{t("mod3.title")}</h2>
              <p className={descripcion}>{t.rich("mod3.desc", { b: (c) => <strong>{c}</strong> })}</p>
            </div>
            <div className="theme-card overflow-hidden lg:col-span-7">
              <div className="window-bar flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-semibold">{t("mod3.winTitle")}</span>
                <span className="text-xs">{t("masonry")}</span>
              </div>
              <DemoVitrina />
            </div>
          </section>

          <section
            data-section-theme="emo"
            className="reveal-section grid grid-cols-1 items-center gap-8 lg:grid-cols-12"
          >
            <div className="theme-card order-2 overflow-hidden lg:order-1 lg:col-span-7">
              <div className="window-bar flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-semibold">{t("mod4.winTitle")}</span>
                <span className="text-xs">{t("rec")}</span>
              </div>
              <DemoAudio />
            </div>
            <div className="order-1 space-y-4 lg:order-2 lg:col-span-5">
              <span className={`${pildora} bg-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)]`}>
                {t("mod4.pill")}
              </span>
              <h2 className={tituloModulo}>{t("mod4.title")}</h2>
              <p className={descripcion}>{t("mod4.desc")}</p>
            </div>
          </section>

          <section
            id="personalizar"
            data-section-theme="whimsical"
            className="reveal-section theme-card space-y-8 p-6 sm:p-10"
          >
            <div className="mx-auto max-w-2xl space-y-3 text-center">
              <span className={`${pildora} bg-[color-mix(in_srgb,var(--accent-tertiary)_40%,transparent)]`}>
                {t("mod5.pill")}
              </span>
              <h2 className={tituloModulo}>{t("mod5.title")}</h2>
              <p className="text-sm text-[var(--text-secondary)] sm:text-base">{t("mod5.desc")}</p>
            </div>
            <Personalizador />
          </section>
        </div>

        {/* ── Privacidad ── */}
        <section className="reveal-section px-4 py-16 sm:px-6 sm:py-20">
          <div className="theme-card relative mx-auto max-w-4xl space-y-6 overflow-hidden p-7 text-center sm:p-12">
            <div
              aria-hidden="true"
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--accent-secondary)_40%,transparent)] text-2xl"
            >
              🗝️
            </div>
            <h2 className="section-title font-literary mx-auto max-w-2xl text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">
              {t("privacy.title")}
            </h2>
            <p className={`mx-auto max-w-xl ${descripcion}`}>{t("privacy.desc")}</p>
            <ul className="grid grid-cols-1 gap-3 pt-2 text-xs font-medium sm:grid-cols-3 sm:text-sm">
              <li className="theme-surface-alt p-3.5">{t("privacy.p1")}</li>
              <li className="theme-surface-alt p-3.5">{t("privacy.p2")}</li>
              <li className="theme-surface-alt p-3.5">{t("privacy.p3")}</li>
            </ul>
          </div>
        </section>

        {/* ── Llamado final, con el logo completo ── */}
        <section className="reveal-section px-4 py-12 text-center sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="theme-card mx-auto w-[min(72vw,18rem)] overflow-hidden">
              <Image src={logo} alt={t("altLogo")} sizes="(min-width: 400px) 288px, 72vw" className="h-auto w-full" />
            </div>
            <h2 className="section-title font-literary text-3xl font-semibold text-[var(--text-primary)] sm:text-5xl">
              {t("ctaFinal.title")}
            </h2>
            <p className={descripcion}>{t("ctaFinal.subtitle")}</p>
            <div className="flex flex-col items-center justify-center gap-3.5 pt-2 sm:flex-row">
              <Link href={RUTA_REGISTRO} className="theme-btn-primary w-full px-8 py-4 text-base font-semibold sm:w-auto">
                {t("ctaFinal.primary")}
              </Link>
              <Link href={RUTA_LOGIN} className="theme-btn-secondary w-full px-7 py-4 text-base font-medium sm:w-auto">
                {t("ctaFinal.secondary")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-8 border-t border-[var(--border-color)] bg-[color-mix(in_srgb,var(--bg-surface)_70%,transparent)] px-4 pt-10 pb-24 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-[var(--text-secondary)] sm:flex-row sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="font-literary font-semibold text-[var(--text-primary)]">{t("marca")}</span>
            <span aria-hidden="true">•</span>
            <span>{t("footer.tagline")}</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/terminos" className="hover:underline">
              {t("footer.terms")}
            </Link>
            <Link href="/privacidad" className="hover:underline">
              {t("footer.privacy")}
            </Link>
            <Link
              href="/"
              locale={otroIdioma}
              hrefLang={otroIdioma}
              className="theme-btn-secondary px-3 py-1 text-xs font-semibold"
            >
              {t("idiomaPie")}
            </Link>
          </nav>
        </div>
      </footer>
    </LandingRaiz>
  );
}
