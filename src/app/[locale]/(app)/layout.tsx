import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  createClient,
  obtenerUsuario,
  type UsuarioSesion,
} from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { MenuCrear } from "@/components/menu-crear";
import { NavSecciones } from "@/components/nav-secciones";
import { PanelPerfil } from "@/components/perfil/panel-perfil";
import { Bienvenida } from "@/components/bienvenida";
import { bienvenidaPendiente, obtenerPerfil } from "@/lib/perfil/queries";
import { formatearBytes } from "@/lib/storage/formato";
import {
  LIMITE_STORAGE_BYTES,
  obtenerUsoStorage,
  UMBRAL_AVISO_STORAGE,
} from "@/lib/storage/uso";
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
      {/* Una sola barra fija arriba: marca, secciones (desde tablet), Crear y
          el avatar. Antes eran dos barras apiladas (título decorativo + menú)
          que ocupaban 96 px fijos en el celular. z-30 para pasarle por encima
          a los desplegables de las pantallas, que usan z-20. Los <dialog>
          (perfil, Crear, ventanitas) no compiten: el navegador los pinta en
          su capa superior, por encima de cualquier z-index. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b-[3px] border-ink bg-secondary-purple pr-3 pl-5 md:h-16 md:px-8">
        <div className="flex items-center gap-2.5">
          <svg width="16" height="14" viewBox="0 0 14 12" aria-hidden="true">
            <path
              d="M2 0h4v2H2zM8 0h4v2H8zM0 2h14v4H0zM2 6h10v2H2zM4 8h6v2H4zM6 10h2v2H6z"
              fill="var(--primary-pink)"
            />
          </svg>
          <span className="font-pixel text-sm tracking-wide text-background">
            CUARTO PROPIO
          </span>
        </div>

        <NavSecciones secciones={links} variante="barra" />

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <MenuCrear variante="barra" />
          </div>
          {/* El perfil (una consulta a la base, más la firma de la foto) llega
              por streaming: sin este `Suspense`, la barra entera y el
              esqueleto de la sección esperaban a que respondiera la base
              antes de mandar el primer byte de la página. */}
          <Suspense fallback={<AvatarCargando />}>
            <AvatarPerfil usuario={usuario} cerrarSesion={logoutWithLocale} />
          </Suspense>
        </div>
      </header>

      {/* En el celular, abajo queda espacio para la barra de secciones fija
          (más la zona segura del iPhone). */}
      <main className="flex flex-1 flex-col px-5 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 md:py-10">
        {/* Bienvenida y aviso de espacio: cada uno su consulta, por
            streaming, para no demorar la página. */}
        <Suspense fallback={null}>
          <AvisosCuenta usuarioId={usuario.id} locale={locale} />
        </Suspense>
        {children}
      </main>

      <NavSecciones secciones={links} variante="inferior" />
    </div>
  );
}

/**
 * Lo que la cuenta tiene que avisar por su cuenta: la bienvenida la primera
 * vez, y el espacio de Storage cuando pasa del 80 % del plan gratuito.
 */
async function AvisosCuenta({
  usuarioId,
  locale,
}: {
  usuarioId: string;
  locale: string;
}) {
  const [pendiente, uso, t] = await Promise.all([
    createClient().then((supabase) => bienvenidaPendiente(supabase, usuarioId)),
    obtenerUsoStorage(),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  const fraccion = uso === null ? 0 : uso / LIMITE_STORAGE_BYTES;
  const datos = {
    porcentaje: Math.min(100, Math.round(fraccion * 100)),
    usado: formatearBytes(uso ?? 0, locale),
    limite: formatearBytes(LIMITE_STORAGE_BYTES, locale),
  };

  return (
    <>
      {pendiente ? <Bienvenida /> : null}
      {fraccion >= UMBRAL_AVISO_STORAGE ? (
        <p
          role="status"
          className="mx-auto mb-6 w-full max-w-3xl border-2 border-ink bg-primary-pink px-4 py-3 text-sm leading-snug text-ink-strong"
        >
          {fraccion >= 1
            ? t("avisoStorageLleno", datos)
            : t("avisoStorage", datos)}
        </p>
      ) : null}
    </>
  );
}

async function AvatarPerfil({
  usuario,
  cerrarSesion,
}: {
  usuario: UsuarioSesion;
  cerrarSesion: () => Promise<void>;
}) {
  const [perfil, usoStorage] = await Promise.all([
    createClient().then((supabase) => obtenerPerfil(supabase, usuario)),
    obtenerUsoStorage(),
  ]);
  return (
    <PanelPerfil
      perfil={perfil}
      usoStorage={usoStorage}
      cerrarSesion={cerrarSesion}
    />
  );
}

/** Mismo tamaño y marco que el avatar de la barra (32 px), para que nada
 * salte cuando llega el de verdad. */
function AvatarCargando() {
  return (
    <span
      aria-hidden="true"
      className="m-1.5 h-8 w-8 shrink-0 border-2 border-ink bg-primary-pink/40 motion-safe:animate-pulse"
    />
  );
}
