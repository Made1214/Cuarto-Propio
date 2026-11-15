import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/supabase/server";
import { AvisoAcceso } from "../componentes";
import { RestablecerForm } from "./restablecer-form";

/** Se llega acá desde el enlace del correo de recuperación, que ya abrió la
 * sesión (ver `/api/auth/confirmar`). Sin sesión, el enlace venció. */
export default async function RestablecerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  const usuario = await obtenerUsuario();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-diario text-3xl font-bold text-secondary-purple">
        {t("restablecerTitulo")}
      </h1>
      {usuario ? (
        <RestablecerForm locale={locale} />
      ) : (
        <>
          <AvisoAcceso tipo="error">{t("enlaceVencido")}</AvisoAcceso>
          <Link
            href="/recuperar"
            className="w-fit text-[13px] font-semibold text-secondary-purple underline-offset-2 hover:underline"
          >
            {t("pedirOtro")}
          </Link>
        </>
      )}
    </div>
  );
}
