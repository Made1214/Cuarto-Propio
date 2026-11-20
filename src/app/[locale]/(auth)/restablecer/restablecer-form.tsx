"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AvisoAcceso, CampoContrasena, CLASE_BOTON } from "../componentes";
import { restablecer, type EstadoAcceso } from "../login/actions";

export function RestablecerForm({ locale }: { locale: string }) {
  const t = useTranslations("login");
  const [state, formAction, pending] = useActionState<EstadoAcceso, FormData>(
    (_prevState, formData) => restablecer(locale, formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <CampoContrasena
        id="password-restablecer"
        etiqueta={t("contrasenaNueva")}
        autoComplete="new-password"
        requisitos
      />
      {state?.error ? (
        <AvisoAcceso tipo="error">{state.error}</AvisoAcceso>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={`${CLASE_BOTON} bg-primary-green`}
      >
        {pending ? t("guardando") : t("guardarContrasena")}
      </button>
    </form>
  );
}
