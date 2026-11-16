"use client";

import { useTranslations } from "next-intl";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * El botón Guardar del Diario vive en la fila de acciones de la página, FUERA
 * del `<form>` (asociado con `form={formId}`), así que `useFormStatus` no le
 * llega. Este contexto es el puente: el formulario cuenta si está guardando y
 * el botón lo muestra. La página envuelve a los dos con `<GuardadoProvider>`.
 */
const GuardadoContext = createContext<{
  guardando: boolean;
  setGuardando: (valor: boolean) => void;
} | null>(null);

export function GuardadoProvider({ children }: { children: ReactNode }) {
  const [guardando, setGuardando] = useState(false);
  return <GuardadoContext value={{ guardando, setGuardando }}>{children}</GuardadoContext>;
}

/** Lo usa el formulario para avisar al botón. Sin provider no hace nada. */
export function useAvisarGuardando(guardando: boolean) {
  const setGuardando = useContext(GuardadoContext)?.setGuardando;
  useEffect(() => {
    setGuardando?.(guardando);
  }, [guardando, setGuardando]);
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
