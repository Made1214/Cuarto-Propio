"use client";

import { useFormatter, useTranslations } from "next-intl";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * El botón Guardar del Diario vive en la barra de acciones de la página,
 * FUERA del `<form>` (asociado con `form={formId}`), así que `useFormStatus`
 * no le llega. Este contexto es el puente: el formulario cuenta si está
 * guardando —y si hay cambios sin guardar, y cuándo se hizo la copia local—
 * y la barra lo muestra. La página envuelve a los dos con
 * `<GuardadoProvider>`.
 */
type EstadoBorrador = { sucio: boolean; guardadoEn: Date | null };

const GuardadoContext = createContext<{
  guardando: boolean;
  setGuardando: (valor: boolean) => void;
  borrador: EstadoBorrador;
  setBorrador: (valor: EstadoBorrador) => void;
} | null>(null);

export function GuardadoProvider({ children }: { children: ReactNode }) {
  const [guardando, setGuardando] = useState(false);
  const [borrador, setBorrador] = useState<EstadoBorrador>({ sucio: false, guardadoEn: null });
  return (
    <GuardadoContext value={{ guardando, setGuardando, borrador, setBorrador }}>
      {children}
    </GuardadoContext>
  );
}

/** Lo usa el formulario para avisar a la barra. Sin provider no hace nada. */
export function useAvisarGuardando(guardando: boolean, sucio = false, guardadoEn: Date | null = null) {
  const contexto = useContext(GuardadoContext);
  const setGuardando = contexto?.setGuardando;
  const setBorrador = contexto?.setBorrador;
  useEffect(() => {
    setGuardando?.(guardando);
  }, [guardando, setGuardando]);
  useEffect(() => {
    setBorrador?.({ sucio, guardadoEn });
  }, [sucio, guardadoEn, setBorrador]);
}

export function GuardarBoton({ formId, className }: { formId: string; className: string }) {
  const t = useTranslations("diario");
  const guardando = useContext(GuardadoContext)?.guardando ?? false;
  return (
    <button
      type="submit"
      form={formId}
      disabled={guardando}
      aria-busy={guardando}
      className={`${className} disabled:cursor-wait disabled:opacity-70`}
    >
      {guardando ? t("guardando") : t("guardar")}
    </button>
  );
}

/**
 * En qué está lo escrito, en una línea al lado de Guardar: guardando, con
 * cambios sin guardar (y desde cuándo hay copia en el dispositivo, para que
 * se sepa que cerrar el navegador no lo pierde) o todo al día. Antes ese
 * aviso aparecía y desaparecía arriba del título y empujaba el formulario.
 */
export function EstadoGuardado() {
  const t = useTranslations("diario");
  const format = useFormatter();
  const contexto = useContext(GuardadoContext);
  if (!contexto) return null;
  const { guardando, borrador } = contexto;

  let texto: string;
  let tono: "neutro" | "pendiente" | "ok";
  if (guardando) {
    texto = t("guardando");
    tono = "pendiente";
  } else if (borrador.sucio) {
    texto = borrador.guardadoEn
      ? t("estadoBorradorLocal", {
          hora: format.dateTime(borrador.guardadoEn, { hour: "numeric", minute: "2-digit" }),
        })
      : t("estadoSinGuardar");
    tono = "pendiente";
  } else {
    texto = t("estadoAlDia");
    tono = "neutro";
  }

  return (
    <p aria-live="polite" className="flex min-w-0 items-center gap-1.5 text-xs leading-tight text-muted/80">
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${
          tono === "pendiente" ? "bg-primary-pink ring-1 ring-ink/40" : "bg-primary-green ring-1 ring-ink/40"
        } ${guardando ? "motion-safe:animate-pulse" : ""}`}
      />
      <span className="min-w-0 truncate">{texto}</span>
    </p>
  );
}
