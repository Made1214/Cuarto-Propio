"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { REQUISITOS_CONTRASENA } from "@/lib/auth/contrasena";

/** Clases compartidas por los formularios de acceso. */
export const CLASE_CAMPO =
  "h-12 w-full border-(length:--borde) border-ink rounded-theme bg-card px-3 text-[15px] text-ink outline-none transition-colors focus:border-secondary-purple";
export const CLASE_ETIQUETA = "flex flex-col gap-1.5 text-[13px] font-semibold";
export const CLASE_BOTON =
  "flex h-12 w-full items-center justify-center border-(length:--borde) border-ink rounded-theme text-[15px] font-bold text-ink-strong shadow-marco transition-[transform,filter] hover:brightness-95 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60";

/** Las pestañas Entrar / Crear cuenta. Son links a dos rutas y no estado
 * local: cada una se puede compartir o guardar, y "atrás" funciona. */
export function PestanasAcceso({ activa }: { activa: "entrar" | "crear" }) {
  const t = useTranslations("login");
  const pestanas = [
    { clave: "entrar", href: "/login", texto: t("tabEntrar") },
    { clave: "crear", href: "/registro", texto: t("tabCrear") },
  ] as const;

  return (
    <nav
      aria-label={t("acceso")}
      className="grid grid-cols-2 border-(length:--borde) border-ink rounded-theme bg-card"
    >
      {pestanas.map(({ clave, href, texto }) => (
        <Link
          key={clave}
          href={href}
          aria-current={clave === activa ? "page" : undefined}
          className={`flex h-11 items-center justify-center text-sm transition-colors ${
            clave === activa
              ? "bg-secondary-purple font-bold text-background"
              : "font-medium text-ink hover:bg-primary-pink/30"
          }`}
        >
          {texto}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Campo de contraseña con botón para verla (en el celular es fácil
 * equivocarse sin verla). Con `requisitos`, debajo se va marcando lo que ya
 * cumple mientras se escribe.
 */
export function CampoContrasena({
  id,
  etiqueta,
  autoComplete,
  requisitos = false,
}: {
  id: string;
  etiqueta: string;
  autoComplete: "current-password" | "new-password";
  requisitos?: boolean;
}) {
  const t = useTranslations("login");
  const [visible, setVisible] = useState(false);
  const [valor, setValor] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {etiqueta}
      </label>
      <div className="flex h-12 border-(length:--borde) border-ink rounded-theme bg-card transition-colors focus-within:border-secondary-purple">
        <input
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
          aria-describedby={requisitos ? `${id}-requisitos` : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("ocultar") : t("mostrar")}
          aria-pressed={visible}
          className="flex w-11 shrink-0 items-center justify-center border-l-(length:--borde) border-ink text-ink hover:bg-primary-pink/30"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {visible ? <path d="M4 4l16 16" /> : null}
          </svg>
        </button>
      </div>

      {requisitos ? (
        <ul
          id={`${id}-requisitos`}
          aria-label={t("requisitos")}
          className="flex flex-col gap-1 text-[13px]"
        >
          {REQUISITOS_CONTRASENA.map(({ clave, cumple }) => {
            const ok = cumple(valor);
            return (
              <li
                key={clave}
                className={`flex items-center gap-2 ${ok ? "" : "text-muted/75"}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 items-center justify-center border-(length:--borde) ${
                    ok
                      ? "border-ink bg-primary-green text-ink-strong"
                      : "border-ink/40"
                  }`}
                >
                  {ok ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      aria-hidden="true"
                    >
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                  ) : null}
                </span>
                {t(clave)}
                <span className="sr-only">
                  {ok ? t("cumplido") : t("pendiente")}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** Aviso dentro del formulario: error (rosado) o confirmación (verde). */
export function AvisoAcceso({
  tipo,
  children,
}: {
  tipo: "error" | "ok";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tipo === "error" ? "alert" : "status"}
      className={`border-(length:--borde) border-ink rounded-theme px-3 py-2.5 text-sm leading-snug text-ink-strong ${
        tipo === "error" ? "bg-primary-pink" : "bg-primary-green"
      }`}
    >
      {children}
    </p>
  );
}
