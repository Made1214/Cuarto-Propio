"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AvisoAcceso,
  CampoContrasena,
  CLASE_BOTON,
  CLASE_CAMPO,
  CLASE_ETIQUETA,
} from "../componentes";
import { login, type EstadoAcceso } from "./actions";

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("login");
  const [state, formAction, pending] = useActionState<EstadoAcceso, FormData>(
    (_prevState, formData) => login(locale, formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className={CLASE_ETIQUETA}>
        {t("email")}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          className={CLASE_CAMPO}
        />
      </label>
      <CampoContrasena
        id="password"
        etiqueta={t("password")}
        autoComplete="current-password"
      />
      <Link
        href="/recuperar"
        className="-mt-1 w-fit text-[13px] font-semibold text-secondary-purple underline-offset-2 hover:underline"
      >
        {t("olvide")}
      </Link>
      {state?.error ? (
        <AvisoAcceso tipo="error">{state.error}</AvisoAcceso>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`${CLASE_BOTON} mt-1 bg-primary-green`}
      >
        {t("entrar")}
      </button>
    </form>
  );
}
