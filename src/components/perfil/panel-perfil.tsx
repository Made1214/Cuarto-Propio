"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AvisoErrorAccion } from "@/components/aviso-error-accion";
import { useRouter } from "@/i18n/navigation";
import { clasificarErrorAccion, type ErrorAccion } from "@/lib/acciones/errores";
import { renombrarPerfil } from "@/lib/perfil/actions";
import { NOMBRE_MAXIMO } from "@/lib/perfil/limites";
import type { PerfilVisible } from "@/lib/perfil/types";
import { Avatar } from "./avatar";
import { FotoPerfil } from "./foto-perfil";
import { IconoCandado, IconoSalir } from "./iconos";
import { SelectorIdioma } from "./selector-idioma";
import { SelectorModo } from "./selector-modo";

/** Lo que va a vivir acá cuando se retome Personalización (CLAUDE.md →
 * Temas de diseño). Se nombran en una sola fila "próximamente" en vez de
 * esconderlas: dicen a dónde va la app sin prometer que ya funciona. */
const PERSONALIZACION = ["temas", "colores", "cursor", "iconos", "tipografia"] as const;

/**
 * El perfil: un cajón que sale del borde derecho al tocar el avatar del
 * navbar.
 *
 * Es un cajón y no una página porque todo lo que hay adentro son ajustes de
 * cómo se ve la app — cambiarlos sin salir de donde estabas es justo la
 * gracia (elegís modo oscuro y lo ves aplicado sobre tu diario, detrás).
 *
 * Va sobre el `<dialog>` nativo, igual que las ventanitas de la app: atrapar
 * el foco, cerrar con Escape, inertizar el fondo y pintar el velo son cosas
 * que el navegador ya hace bien.
 */
export function PanelPerfil({
  perfil,
  cerrarSesion,
}: {
  perfil: PerfilVisible;
  /** La Server Action de logout, ya atada al idioma actual por el layout. */
  cerrarSesion: () => Promise<void>;
}) {
  const t = useTranslations("perfil");
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [, startTransition] = useTransition();
  const [errorNombre, setErrorNombre] = useState<ErrorAccion | null>(null);

  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    if (abierto && !panel.open) panel.showModal();
    if (!abierto && panel.open) panel.close();
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={t("abrir")}
        title={t("abrir")}
        aria-expanded={abierto}
        className="flex items-center gap-2 p-1.5 transition-transform active:translate-x-0.5 active:translate-y-0.5"
      >
        <Avatar perfil={perfil} />
      </button>

      <dialog
        ref={ref}
        onClose={() => setAbierto(false)}
        onClick={(evento) => {
          if (evento.target === ref.current) setAbierto(false);
        }}
        className="panel-lateral m-0 ml-auto h-dvh max-h-[100dvh] w-[min(22rem,100vw)] max-w-[100vw] border-0 bg-transparent p-0 text-foreground backdrop:bg-velo"
      >
        <div className="flex h-full flex-col border-l-[3px] border-ink bg-card">
          {/* Barra de título, igual que la de la ventana principal */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b-[3px] border-ink bg-secondary-purple px-4 py-3">
            <h2 className="truncate font-pixel text-xs tracking-wide text-background">
              {t("titulo").toUpperCase()}
            </h2>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label={t("cerrar")}
              title={t("cerrar")}
              className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-primary-pink transition-[filter] hover:brightness-90"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ink-strong)"
                strokeWidth="3"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
            <FotoPerfil perfil={perfil} />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="perfil-nombre"
                className="text-xs font-semibold"
              >
                {t("nombre")}
              </label>
              <input
                id="perfil-nombre"
                type="text"
                defaultValue={perfil.nombre ?? ""}
                maxLength={NOMBRE_MAXIMO}
                placeholder={t("nombrePlaceholder")}
                // Se guarda al salir del campo, como el título de una nota de
                // audio: no hay botón "guardar" porque no hay nada que
                // confirmar, es un solo dato.
                onBlur={(evento) => {
                  const valor = evento.target.value.trim();
                  if (valor === (perfil.nombre ?? "")) return;
                  setErrorNombre(null);
                  startTransition(async () => {
                    try {
                      await renombrarPerfil(valor);
                    } catch (fallo) {
                      // Avisar dentro del panel en vez de caer en la pantalla
                      // de error, igual que Listas y Audio.
                      startTransition(() => setErrorNombre(clasificarErrorAccion(fallo)));
                      return;
                    }
                    router.refresh();
                  });
                }}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter") evento.currentTarget.blur();
                }}
                className="border-2 border-ink bg-background px-3 py-2 font-diario text-base outline-none placeholder:text-muted/50"
              />
              <AvisoErrorAccion error={errorNombre} mensajeFallo={t("errorNombre")} />
              {perfil.email ? (
                <p className="truncate pt-0.5 text-xs text-muted/70">{perfil.email}</p>
              ) : null}
            </div>

            <Seccion titulo={t("apariencia")} ayuda={t("modoAyuda")}>
              <SelectorModo />
            </Seccion>

            <Seccion titulo={t("idioma")}>
              <SelectorIdioma />
            </Seccion>

            {/* Una sola fila y no cinco con candado: dice a dónde va la app
                sin llenar el panel de cosas que todavía no se pueden tocar. */}
            <section className="flex items-center gap-3 border-2 border-dashed border-ink/50 p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink bg-background">
                <IconoCandado />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold">
                  {t("personalizacion")} · {t("proximamente")}
                </h3>
                <p className="mt-0.5 text-xs text-muted/75">
                  {PERSONALIZACION.map((clave) => t(clave)).join(", ")}
                </p>
              </div>
            </section>
          </div>

          <form
            action={cerrarSesion}
            className="shrink-0 border-t-[3px] border-ink bg-background px-5 py-4"
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 border-2 border-ink bg-card h-11 px-3 text-sm font-semibold text-ink transition-[transform,filter] hover:bg-primary-pink hover:text-ink-strong active:translate-x-0.5 active:translate-y-0.5"
            >
              <IconoSalir />
              {t("cerrarSesion")}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}

function Seccion({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 border-t-2 border-ink/15 pt-5">
      <h3 className="font-pixel text-xs tracking-wide text-secondary-purple">
        {titulo.toUpperCase()}
      </h3>
      {children}
      {ayuda ? <p className="text-xs leading-relaxed text-muted/70">{ayuda}</p> : null}
    </section>
  );
}
