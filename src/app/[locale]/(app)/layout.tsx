import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient, obtenerUsuario, type UsuarioSesion } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { NavSecciones } from "@/components/nav-secciones";
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
  // Los dos en paralelo: ninguno depende del otro. `obtenerUsuario` verifica
  // el JWT localmente (sin red, ver src/lib/supabase/server.ts), así que el
  // chequeo de sesión ya no retrasa el primer byte como cuando era una ida al
  // servidor de Auth.
  const [usuario, t] = await Promise.all([
    obtenerUsuario(),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  if (!usuario) {
    // El proxy ya redirige al login sin sesión; esto queda como segunda línea
    // de defensa por si una ruta privada se le escapa a su `matcher`.
    // `redirect` corta la ejecución lanzando, pero su tipo no lo declara: el
    // `return` es lo que le deja saber a TypeScript que más abajo `usuario`
    // ya existe (lo necesita el perfil). En tiempo de ejecución nunca se
    // alcanza.
    redirect({ href: "/login", locale });
    return null;
  }

  const logoutWithLocale = logout.bind(null, locale);

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
          <NavSecciones secciones={links} />
          {/* El perfil (una consulta a la base, más la firma de la foto) llega
              por streaming: sin este `Suspense`, la barra entera y el
              esqueleto de la sección esperaban a que respondiera la base
              antes de mandar el primer byte de la página. */}
          <Suspense fallback={<AvatarCargando />}>
            <AvatarPerfil usuario={usuario} cerrarSesion={logoutWithLocale} />
          </Suspense>
        </header>
      </div>

      <main className="flex flex-1 flex-col px-6 py-10">{children}</main>
    </div>
  );
}

async function AvatarPerfil({
  usuario,
  cerrarSesion,
}: {
  usuario: UsuarioSesion;
  cerrarSesion: () => Promise<void>;
}) {
  const perfil = await obtenerPerfil(await createClient(), usuario);
  return <PanelPerfil perfil={perfil} cerrarSesion={cerrarSesion} />;
}

/** Mismo tamaño y marco que el avatar de la barra (32 px), para que nada
 * salte cuando llega el de verdad. */
function AvatarCargando() {
  return (
    <span
      aria-hidden="true"
      className="h-8 w-8 shrink-0 border-2 border-ink bg-primary-pink/40 motion-safe:animate-pulse"
    />
  );
}
