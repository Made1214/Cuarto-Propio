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
import { registrar, type EstadoAcceso } from "../login/actions";

export function RegistroForm({ locale, tema }: { locale: string; tema: string | null }) {
  const t = useTranslations("login");
  const [state, formAction, pending] = useActionState<EstadoAcceso, FormData>(
    (_prevState, formData) => registrar(locale, formData),
    undefined,
  );

  // Ya se mandó el correo: el formulario no tiene más que hacer.
  if (state?.enviado)
    return <AvisoAcceso tipo="ok">{t("registroEnviado")}</AvisoAcceso>;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {tema ? <input type="hidden" name="tema" value={tema} /> : null}
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
        id="password-nueva"
        etiqueta={t("password")}
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
        className={`${CLASE_BOTON} mt-1 bg-primary-pink`}
      >
        {pending ? t("creando") : t("crear")}
      </button>
      <p className="text-[13px] leading-snug text-muted/80">
        {t("registroAyuda")}
      </p>
      <p className="text-[13px] leading-snug text-muted/80">
        {t.rich("legal", {
          terminos: (texto) => (
            <Link
              href="/terminos"
              className="font-semibold text-secondary-purple underline underline-offset-2"
            >
              {texto}
            </Link>
          ),
          privacidad: (texto) => (
            <Link
              href="/privacidad"
              className="font-semibold text-secondary-purple underline underline-offset-2"
            >
              {texto}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
