"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AvisoErrorAccion } from "@/components/aviso-error-accion";
import { Link, useRouter } from "@/i18n/navigation";
import {
  clasificarErrorAccion,
  type ErrorAccion,
} from "@/lib/acciones/errores";
import { renombrarPerfil } from "@/lib/perfil/actions";
import { NOMBRE_MAXIMO } from "@/lib/perfil/limites";
import { formatearBytes } from "@/lib/storage/formato";
import {
  LIMITE_STORAGE_BYTES,
  UMBRAL_AVISO_STORAGE,
} from "@/lib/storage/limites";
import type { PerfilVisible } from "@/lib/perfil/types";
import { Avatar } from "./avatar";
import { FotoPerfil } from "./foto-perfil";
import { IconoSalir } from "./iconos";
import { SelectorIdioma } from "./selector-idioma";
import { SelectorModo } from "./selector-modo";

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
  usoStorage,
  cerrarSesion,
}: {
  perfil: PerfilVisible;
  /** Bytes usados en Storage, o `null` si no se pudo saber (ver
   * `obtenerUsoStorage`): entonces el medidor no se muestra. */
  usoStorage: number | null;
  /** La Server Action de logout, ya atada al idioma actual por el layout. */
  cerrarSesion: () => Promise<void>;
}) {
  const t = useTranslations("perfil");
  const locale = useLocale();
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [, startTransition] = useTransition();
  const [errorNombre, setErrorNombre] = useState<ErrorAccion | null>(null);
  // Se guarda al salir del campo, sin botón: una marquita confirma que quedó.
  const [nombreGuardado, setNombreGuardado] = useState(false);

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
        <div className="flex h-full flex-col border-l-(length:--borde-grueso) border-ink bg-card">
          {/* Barra de título, igual que la de la ventana principal */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b-(length:--borde-grueso) border-ink bg-secondary-purple px-4 py-3">
            <h2 className="truncate font-pixel text-xs tracking-wide text-background uppercase">
              {t("titulo")}
            </h2>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label={t("cerrar")}
              title={t("cerrar")}
              className="flex h-9 w-9 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-primary-pink transition-[filter] hover:brightness-90"
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
              <label htmlFor="perfil-nombre" className="text-xs font-semibold">
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
                  setNombreGuardado(false);
                  startTransition(async () => {
                    try {
                      await renombrarPerfil(valor);
                    } catch (fallo) {
                      // Avisar dentro del panel en vez de caer en la pantalla
                      // de error, igual que Listas y Audio.
                      startTransition(() =>
                        setErrorNombre(clasificarErrorAccion(fallo)),
                      );
                      return;
                    }
                    router.refresh();
                    startTransition(() => setNombreGuardado(true));
                    window.setTimeout(() => setNombreGuardado(false), 2500);
                  });
                }}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter") evento.currentTarget.blur();
                }}
                className="h-11 border-(length:--borde) border-ink rounded-theme bg-background px-3 font-diario text-base outline-none placeholder:text-muted/50 focus:border-secondary-purple"
              />
              <AvisoErrorAccion
                error={errorNombre}
                mensajeFallo={t("errorNombre")}
              />
              {nombreGuardado ? (
                <p role="status" className="flex items-center gap-1.5 text-xs font-semibold text-muted/80">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                  {t("nombreGuardado")}
                </p>
              ) : null}
              {perfil.email ? (
                <p className="truncate pt-0.5 text-xs text-muted/70">
                  {perfil.email}
                </p>
              ) : null}
            </div>

            <Seccion titulo={t("apariencia")} ayuda={t("modoAyuda")}>
              <SelectorModo />
            </Seccion>

            <Seccion titulo={t("idioma")}>
              <SelectorIdioma />
            </Seccion>

            {/* Personalización vive en su propia pantalla: necesita lugar
                para ver cada opción antes de elegirla. */}
            <Link
              href="/personalizacion"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-3 border-(length:--borde) border-ink rounded-theme bg-background p-3.5 transition-colors hover:bg-primary-pink/25"
            >
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-primary-pink text-ink-strong">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{t("abrirPersonalizacion")}</span>
                <span className="mt-0.5 block text-xs text-muted/75">{t("personalizacionAyudaCorta")}</span>
              </span>
              <span aria-hidden="true">→</span>
            </Link>

            {usoStorage !== null ? (
              <Seccion titulo={t("espacioUsado")} ayuda={t("espacioAyuda")}>
                <MedidorStorage
                  usado={usoStorage}
                  etiqueta={t("espacioUsado")}
                  texto={t("espacioDe", {
                    usado: formatearBytes(usoStorage, locale),
                    limite: formatearBytes(LIMITE_STORAGE_BYTES, locale),
                  })}
                />
              </Seccion>
            ) : null}
          </div>

          <form
            action={cerrarSesion}
            className="flex shrink-0 flex-col gap-3 border-t-(length:--borde-grueso) border-ink bg-background px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 border-(length:--borde) border-ink rounded-theme bg-card h-11 px-3 text-sm font-semibold text-ink transition-[transform,filter] hover:bg-primary-pink hover:text-ink-strong active:translate-x-0.5 active:translate-y-0.5"
            >
              <IconoSalir />
              {t("cerrarSesion")}
            </button>
            <p className="flex justify-center gap-4 text-xs text-muted/80">
              <Link
                href="/terminos"
                onClick={() => setAbierto(false)}
                className="underline-offset-2 hover:underline"
              >
                {t("terminos")}
              </Link>
              <Link
                href="/privacidad"
                onClick={() => setAbierto(false)}
                className="underline-offset-2 hover:underline"
              >
                {t("privacidad")}
              </Link>
            </p>
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
    <section className="flex flex-col gap-2 border-t-(length:--borde) border-ink/15 pt-5">
      <h3 className="rotulo">
        {titulo}
      </h3>
      {children}
      {ayuda ? (
        <p className="text-xs leading-relaxed text-muted/70">{ayuda}</p>
      ) : null}
    </section>
  );
}

function MedidorStorage({
  usado,
  etiqueta,
  texto,
}: {
  usado: number;
  etiqueta: string;
  texto: string;
}) {
  const fraccion = Math.min(1, usado / LIMITE_STORAGE_BYTES);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold tabular-nums">{texto}</span>
      <div
        role="meter"
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuemax={LIMITE_STORAGE_BYTES}
        aria-valuenow={usado}
        aria-valuetext={texto}
        className="h-3 w-full border-(length:--borde) border-ink rounded-theme bg-background"
      >
        <div
          className={`h-full ${fraccion >= UMBRAL_AVISO_STORAGE ? "bg-primary-pink" : "bg-secondary-turquoise"}`}
          style={{ width: `${Math.max(fraccion * 100, usado > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}
