"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AvisoAcceso,
  CampoCorreo,
  CampoContrasena,
  CLASE_BOTON,
} from "../componentes";
import { login, type EstadoAcceso } from "./actions";

export function LoginForm({ locale, siguiente }: { locale: string; siguiente: string | null }) {
  const t = useTranslations("login");
  const [state, formAction, pending] = useActionState<EstadoAcceso, FormData>(
    (_prevState, formData) => login(locale, formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {siguiente ? <input type="hidden" name="next" value={siguiente} /> : null}
      <CampoCorreo etiqueta={t("email")} />
      <CampoContrasena
        id="password"
        etiqueta={t("password")}
        autoComplete="current-password"
      />
      <Link
        href="/recuperar"
        className="-my-2.5 inline-flex min-h-11 w-fit items-center text-[13px] font-semibold text-secondary-purple underline-offset-2 hover:underline"
      >
        {t("olvide")}
      </Link>
      {state?.error ? (
        <AvisoAcceso tipo="error">{state.error}</AvisoAcceso>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={`${CLASE_BOTON} mt-1 bg-primary-green`}
      >
        {pending ? t("entrando") : t("entrar")}
      </button>
    </form>
  );
}
