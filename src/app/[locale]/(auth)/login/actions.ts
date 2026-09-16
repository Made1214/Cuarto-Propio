"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";

export async function login(locale: string, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const t = await getTranslations({ locale, namespace: "login" });
    return { error: t("error") };
  }

  redirect({ href: "/diario", locale });
}

export async function logout(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/login", locale });
}
