import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link, redirect } from "@/i18n/navigation";
import { logout } from "../(auth)/login/actions";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  const t = await getTranslations({ locale, namespace: "nav" });
  const logoutWithLocale = logout.bind(null, locale);

  const links = [
    { href: "/diario", label: t("diario") },
    { href: "/listas", label: t("listas") },
    { href: "/galeria", label: t("galeria") },
    { href: "/audio", label: t("audio") },
    { href: "/ajustes", label: t("ajustes") },
  ] as const;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      {/* Barra de título tipo ventana retro */}
      <div className="flex h-12 items-center justify-between border-b-[3px] border-ink bg-secondary-purple px-5">
        <div className="flex items-center gap-2.5">
          <svg width="16" height="14" viewBox="0 0 14 12" aria-hidden="true">
            <rect x="2" y="0" width="4" height="2" fill="var(--primary-pink)" />
            <rect x="8" y="0" width="4" height="2" fill="var(--primary-pink)" />
            <rect x="0" y="2" width="14" height="2" fill="var(--primary-pink)" />
            <rect x="0" y="4" width="14" height="2" fill="var(--primary-pink)" />
            <rect x="2" y="6" width="10" height="2" fill="var(--primary-pink)" />
            <rect x="4" y="8" width="6" height="2" fill="var(--primary-pink)" />
            <rect x="6" y="10" width="2" height="2" fill="var(--primary-pink)" />
          </svg>
          <span className="font-pixel text-xs tracking-wide text-background">
            CUARTO_PROPIO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 border-2 border-ink bg-primary-green" />
          <span className="h-3 w-3 border-2 border-ink bg-secondary-turquoise" />
          <span className="h-3 w-3 border-2 border-ink bg-primary-pink" />
        </div>
      </div>

      {/* Barra de menú / navegación */}
      <header className="flex h-12 items-center justify-between border-b-[3px] border-ink bg-card px-5">
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-pixel text-xs tracking-wide text-muted/70 transition-colors hover:text-secondary-purple"
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </nav>
        <form action={logoutWithLocale}>
          <button
            type="submit"
            className="border-2 border-ink bg-background px-3 py-1.5 font-pixel text-xs tracking-wide text-ink transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            {t("cerrarSesion").toUpperCase()}
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col px-6 py-10">{children}</main>
    </div>
  );
}
