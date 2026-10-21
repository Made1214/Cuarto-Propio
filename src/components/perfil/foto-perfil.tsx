"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { useRouter } from "@/i18n/navigation";
import { FORMATOS_ACEPTADOS, TAMANO_MAXIMO_BYTES } from "@/lib/perfil/limites";
import type { PerfilVisible } from "@/lib/perfil/types";
import { Avatar } from "./avatar";
import { IconoCamara, IconoQuitar } from "./iconos";

/** Códigos que devuelve /api/perfil/foto → clave de traducción. La ruta vive
 * fuera de [locale] y manda códigos, no frases: traducir es tarea de acá. */
const ERRORES: Record<string, string> = {
  sesion: "errorSesion",
  tamano: "errorTamano",
  formato: "errorFormato",
};

/**
 * Foto de perfil: se elige un archivo, se sube por la ruta de API (el mismo
 * pipeline de la Vitrina, carpeta `perfil`) y la página se refresca para que
 * el avatar del navbar cambie junto con este.
 */
export function FotoPerfil({ perfil }: { perfil: PerfilVisible }) {
  const t = useTranslations("perfil");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function subir(archivo: File) {
    setError(null);

    // Se corta acá lo que igual va a rebotar en el servidor: así no se sube
    // una foto de 40MB por una conexión de celular para nada.
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      setError(t("errorTamano"));
      return;
    }

    setSubiendo(true);
    try {
      const cuerpo = new FormData();
      cuerpo.append("archivo", archivo);
      const respuesta = await fetch("/api/perfil/foto", { method: "POST", body: cuerpo });

      if (!respuesta.ok) {
        const { error: codigo } = await respuesta.json().catch(() => ({ error: "fallo" }));
        setError(t(ERRORES[codigo] ?? "errorFallo"));
        return;
      }

      startTransition(() => router.refresh());
    } catch {
      setError(t("errorFallo"));
    } finally {
      setSubiendo(false);
    }
  }

  async function quitar() {
    setError(null);
    setSubiendo(true);
    try {
      const respuesta = await fetch("/api/perfil/foto", { method: "DELETE" });
      if (!respuesta.ok) {
        setError(t("errorFallo"));
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError(t("errorFallo"));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Avatar perfil={perfil} tamano="panel" />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={FORMATOS_ACEPTADOS}
            className="hidden"
            onChange={(evento) => {
              const archivo = evento.target.files?.[0];
              // Se limpia para poder volver a elegir el mismo archivo después
              // de un error: sin esto el input no dispara `change` dos veces.
              evento.target.value = "";
              if (archivo) void subir(archivo);
            }}
          />

          <button
            type="button"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 border-2 border-ink bg-primary-green px-3 py-2 font-pixel text-[0.625rem] tracking-wide text-ink-strong shadow-[3px_3px_0_var(--ink)] transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
          >
            <IconoCamara />
            {(subiendo ? t("subiendoFoto") : t("cambiarFoto")).toUpperCase()}
          </button>

          {perfil.fotoUrl ? (
            <BotonConfirmar
              titulo={t("quitarFoto")}
              mensaje={t("quitarFotoConfirmar")}
              textoConfirmar={t("quitarFoto")}
              etiqueta={t("quitarFoto")}
              onConfirmar={() => void quitar()}
              className="flex items-center justify-center gap-2 border-2 border-dashed border-ink px-3 py-1.5 font-pixel text-[0.625rem] tracking-wide text-ink transition-colors hover:bg-secondary-purple/10"
            >
              <IconoQuitar />
              {t("quitarFoto").toUpperCase()}
            </BotonConfirmar>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="border-2 border-ink bg-primary-pink px-3 py-2 text-sm text-ink-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}
