"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  aplicarModo,
  leerModo,
  MODO_POR_DEFECTO,
  suscribirModo,
  type ModoPreferido,
} from "@/lib/temas/modo";
import { IconoAuto, IconoLuna, IconoSol } from "./iconos";

const OPCIONES = [
  { modo: "claro", clave: "modoClaro", Icono: IconoSol },
  { modo: "oscuro", clave: "modoOscuro", Icono: IconoLuna },
  { modo: "auto", clave: "modoAuto", Icono: IconoAuto },
] as const satisfies readonly { modo: ModoPreferido; clave: string; Icono: () => React.ReactElement }[];

/**
 * Claro / oscuro / automático.
 *
 * El cambio se ve al instante porque no pasa por el servidor: se reescribe
 * `data-modo` en el `<html>` y el CSS hace el resto (globals.css).
 *
 * La preferencia se lee del navegador con `useSyncExternalStore` y no con
 * estado propio: el servidor no puede saber qué eligió esta persona, así
 * que rinde "auto" y el cliente corrige apenas hidrata, sin desajuste.
 */
export function SelectorModo() {
  const t = useTranslations("perfil");
  const modo = useSyncExternalStore(suscribirModo, leerModo, () => MODO_POR_DEFECTO);

  useLayoutEffect(() => {
    // En desarrollo, el remontaje de Strict Mode borra del <html> los
    // atributos que React no maneja desde el JSX, incluido el que puso el
    // script del <head>. En producción esto es un no-op: ya estaba puesto.
    aplicarModo(leerModo());
  }, []);

  function elegir(elegido: ModoPreferido) {
    aplicarModo(elegido);
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("modo")}
      className="grid grid-cols-3 gap-2"
    >
      {OPCIONES.map(({ modo: opcion, clave, Icono }) => {
        const activo = opcion === modo;
        return (
          <button
            key={opcion}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => elegir(opcion)}
            className={`flex flex-col items-center gap-1.5 border-2 border-ink px-2 py-2.5 text-[13px] font-semibold transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              activo
                ? "bg-primary-green text-ink-strong shadow-[3px_3px_0_var(--ink)]"
                : "bg-card text-ink"
            }`}
          >
            <Icono />
            {t(clave)}
          </button>
        );
      })}
    </div>
  );
}
