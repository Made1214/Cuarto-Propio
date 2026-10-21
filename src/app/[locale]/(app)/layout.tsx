import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link, redirect } from "@/i18n/navigation";
import { PanelPerfil } from "@/components/perfil/panel-perfil";
import { obtenerPerfil } from "@/lib/perfil/queries";
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
    // `redirect` corta la ejecución lanzando, pero su tipo no lo declara: el
    // `return` es lo que le deja saber a TypeScript que más abajo `user` ya
    // existe (lo necesita el perfil). En tiempo de ejecución nunca se alcanza.
    redirect({ href: "/login", locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: "nav" });
  const logoutWithLocale = logout.bind(null, locale);
  const perfil = await obtenerPerfil(supabase, user);

  // Ajustes ya no es un link más: todo lo que era esa pantalla (y más) vive
  // ahora en el panel de perfil, que se abre desde el avatar de la derecha.
  const links = [
    { href: "/diario", label: t("diario") },
    { href: "/listas", label: t("listas") },
    { href: "/vitrina", label: t("vitrina") },
    { href: "/audio", label: t("audio") },
  ] as const;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      {/* Las dos barras viajan juntas y quedan fijas arriba: son el marco de
          la ventana, no contenido. z-30 para pasarle por encima a los
          desplegables de las pantallas, que usan z-20. Los <dialog> (panel de
          perfil, ventanitas) no compiten: el navegador los pinta en su capa
          superior, por encima de cualquier z-index. */}
      <div className="sticky top-0 z-30 flex flex-col">
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
          <PanelPerfil perfil={perfil} cerrarSesion={logoutWithLocale} />
        </header>
      </div>

      <main className="flex flex-1 flex-col px-6 py-10">{children}</main>
    </div>
  );
}
