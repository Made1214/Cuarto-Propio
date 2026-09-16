"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { login } from "./actions";

type ActionState = { error?: string } | undefined;

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("login");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prevState, formData) => login(locale, formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-black/10 px-3 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-black/10 px-3 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {t("entrar")}
      </button>
    </form>
  );
}
