import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">{t("titulo")}</h1>
        <p className="mb-6 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("subtitulo")}
        </p>
        <LoginForm locale={locale} />
      </div>
    </main>
  );
}
