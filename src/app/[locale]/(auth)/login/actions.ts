"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import type { AuthError } from "@supabase/supabase-js";
import { contrasenaValida } from "@/lib/auth/contrasena";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { aplicarTemaInicial, META_TEMA_INICIAL } from "@/lib/temas/inicial";
import { esPreset } from "@/lib/temas/presets";
import { destinoSeguro } from "@/lib/auth/destino";

export type EstadoAcceso = { error?: string; enviado?: boolean } | undefined;

/** Desde dónde se abrió la app, para armar los enlaces de los correos
 * (confirmar cuenta, recuperar contraseña) que vuelven a este mismo sitio:
 * localhost en desarrollo, la URL de Vercel en producción. */
async function origen(): Promise<string> {
  const h = await headers();
  const declarado = h.get("origin");
  if (declarado) return declarado;
  const protocolo = h.get("x-forwarded-proto") ?? "https";
  return `${protocolo}://${h.get("host")}`;
}

/** Los enlaces de los correos pasan por `/api/auth/confirmar`, que abre la
 * sesión y recién ahí manda a `siguiente`. */
async function enlaceConfirmacion(siguiente: string) {
  return `${await origen()}/api/auth/confirmar?next=${encodeURIComponent(siguiente)}`;
}

function esLimiteDeIntentos(error: AuthError) {
  return (
    error.status === 429 ||
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit"
  );
}

/** Minutos (redondeados para arriba) que faltan para `hasta`. */
function minutosHasta(hasta: string): number {
  return Math.max(
    1,
    Math.ceil((new Date(hasta).getTime() - Date.now()) / 60_000),
  );
}

/**
 * Entrar. Además de los límites por IP de Supabase, bloquea 15 minutos una
 * cuenta tras 5 contraseñas equivocadas seguidas (migración 0009). Si esa
 * migración todavía no está aplicada, las llamadas fallan y el login sigue
 * funcionando como antes, sin el bloqueo: mejor eso que dejar a la usuaria
 * afuera por una función que falta.
 */
export async function login(
  locale: string,
  formData: FormData,
): Promise<EstadoAcceso> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const t = await getTranslations({ locale, namespace: "login" });

  const bloqueo = await supabase.rpc("login_bloqueado_hasta", {
    p_email: email,
  });
  if (!bloqueo.error && bloqueo.data) {
    return {
      error: t("cuentaBloqueada", {
        minutos: minutosHasta(bloqueo.data as string),
      }),
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (esLimiteDeIntentos(error)) return { error: t("demasiadosIntentos") };
    if (error.code === "email_not_confirmed")
      return { error: t("confirmarCorreo") };
    if (error.code === "invalid_credentials") {
      const fallo = await supabase.rpc("registrar_fallo_login", {
        p_email: email,
      });
      if (!fallo.error && fallo.data) {
        return {
          error: t("cuentaBloqueada", {
            minutos: minutosHasta(fallo.data as string),
          }),
        };
      }
    }
    return { error: t("error") };
  }

  // Entró: los fallos anteriores ya no cuentan como "seguidos". Y si se
  // registró desde el probador de la landing, su cuarto empieza con ese tema.
  await Promise.all([supabase.rpc("limpiar_intentos_login"), aplicarTemaInicial(supabase)]);

  // De vuelta a donde iba antes de que le pidieran entrar (`?next=`, lo pone
  // el proxy), o al diario.
  redirect({ href: destinoSeguro(formData.get("next")) ?? "/diario", locale });
}

/**
 * Crear cuenta. Supabase manda el correo de verificación y no deja entrar
 * hasta que se abra el enlace.
 *
 * La respuesta es la misma exista o no una cuenta con ese correo (CLAUDE.md →
 * Login: mensaje genérico, para no revelar qué correos están registrados).
 */
export async function registrar(
  locale: string,
  formData: FormData,
): Promise<EstadoAcceso> {
  const t = await getTranslations({ locale, namespace: "login" });
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const tema = formData.get("tema");

  if (!contrasenaValida(password)) return { error: t("contrasenaDebil") };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: await enlaceConfirmacion(`/${locale}/diario`),
      // El tema elegido en el probador de la landing: se aplica la primera
      // vez que haya sesión (ver src/lib/temas/inicial.ts).
      data: esPreset(tema) ? { [META_TEMA_INICIAL]: tema } : undefined,
    },
  });

  if (error) {
    if (esLimiteDeIntentos(error)) return { error: t("demasiadosIntentos") };
    if (error.code === "weak_password") return { error: t("contrasenaDebil") };
    // Correo ya registrado: misma respuesta que un registro nuevo.
    if (error.code !== "user_already_exists" && error.code !== "email_exists") {
      return { error: t("errorRegistro") };
    }
  }

  // Si el proyecto tuviera la verificación apagada, la cuenta ya viene con
  // sesión: no tiene sentido pedirle que revise el correo.
  if (data?.session) {
    await aplicarTemaInicial(supabase);
    redirect({ href: "/diario", locale });
  }

  return { enviado: true };
}

/** "Olvidé mi contraseña": manda el enlace para elegir una nueva. Misma
 * respuesta exista o no la cuenta. */
export async function pedirRecuperacion(
  locale: string,
  formData: FormData,
): Promise<EstadoAcceso> {
  const t = await getTranslations({ locale, namespace: "login" });
  const email = String(formData.get("email") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await enlaceConfirmacion(`/${locale}/restablecer`),
  });

  if (error && esLimiteDeIntentos(error))
    return { error: t("demasiadosIntentos") };
  return { enviado: true };
}

/** Guarda la contraseña nueva. Solo funciona con la sesión que abrió el
 * enlace del correo de recuperación. */
export async function restablecer(
  locale: string,
  formData: FormData,
): Promise<EstadoAcceso> {
  const t = await getTranslations({ locale, namespace: "login" });
  const password = String(formData.get("password") ?? "");

  if (!contrasenaValida(password)) return { error: t("contrasenaDebil") };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "weak_password") return { error: t("contrasenaDebil") };
    if (error.code === "same_password") return { error: t("mismaContrasena") };
    return { error: t("errorRestablecer") };
  }

  redirect({ href: "/diario", locale });
}

export async function logout(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/login", locale });
}
