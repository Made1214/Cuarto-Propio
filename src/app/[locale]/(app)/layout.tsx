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
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
        <span className="text-lg font-semibold tracking-tight">Cuarto Propio</span>
        <nav className="flex items-center gap-5 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-700 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <form action={logoutWithLocale}>
            <button
              type="submit"
              className="text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              {t("cerrarSesion")}
            </button>
          </form>
        </nav>
      </header>
      <main className="flex flex-1 flex-col px-6 py-10">{children}</main>
    </div>
  );
}
