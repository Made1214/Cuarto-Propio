"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AvisoAcceso, CLASE_BOTON, CLASE_CAMPO, CLASE_ETIQUETA } from "../componentes";
import { pedirRecuperacion, type EstadoAcceso } from "../login/actions";

export function RecuperarForm({ locale }: { locale: string }) {
  const t = useTranslations("login");
  const [state, formAction, pending] = useActionState<EstadoAcceso, FormData>(
    (_prevState, formData) => pedirRecuperacion(locale, formData),
    undefined,
  );

  const volver = (
    <Link href="/login" className="w-fit text-[13px] font-semibold text-secondary-purple underline-offset-2 hover:underline">
      ← {t("volverEntrar")}
    </Link>
  );

  if (state?.enviado) {
    return (
      <div className="flex flex-col gap-4">
        <AvisoAcceso tipo="ok">{t("recuperarEnviado")}</AvisoAcceso>
        {volver}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className={CLASE_ETIQUETA}>
        {t("email")}
        <input name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" className={CLASE_CAMPO} />
      </label>
      {state?.error ? <AvisoAcceso tipo="error">{state.error}</AvisoAcceso> : null}
      <button type="submit" disabled={pending} className={`${CLASE_BOTON} bg-primary-green`}>
        {t("enviarEnlace")}
      </button>
      {volver}
    </form>
  );
}
