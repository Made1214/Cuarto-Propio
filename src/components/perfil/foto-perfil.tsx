"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { useRouter } from "@/i18n/navigation";
import { reducirImagen } from "@/lib/imagenes/reducir";
import {
  FORMATOS_ACEPTADOS,
  TAMANO_MAXIMO_BYTES,
  TAMANO_MAXIMO_ORIGINAL_BYTES,
} from "@/lib/perfil/limites";
import type { PerfilVisible } from "@/lib/perfil/types";
import { Avatar } from "./avatar";
import { IconoCamara, IconoQuitar } from "./iconos";

/** Códigos que devuelve /api/perfil/foto → clave de traducción. La ruta vive
 * fuera de [locale] y manda códigos, no frases: traducir es tarea de acá. */
const ERRORES: Record<string, string> = {
  sesion: "errorSesion",
  tamano: "errorTamano",
  espacio: "errorEspacio",
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

    // Un original absurdo ni se intenta abrir: decodificar 40MB en un
    // celular para achicarlo no tiene sentido.
    if (archivo.size > TAMANO_MAXIMO_ORIGINAL_BYTES) {
      setError(t("errorTamano"));
      return;
    }

    setSubiendo(true);
    try {
      // Se reduce en el navegador (Vercel corta las peticiones de más de
      // 4,5 MB) y recién lo reducido se compara con el tope del servidor:
      // es lo que viaja, y lo que igual rebotaría no se sube para nada.
      const reducido = await reducirImagen(archivo);
      if (reducido.size > TAMANO_MAXIMO_BYTES) {
        setError(t("errorTamano"));
        return;
      }

      const cuerpo = new FormData();
      cuerpo.append("archivo", reducido);
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
            className="flex items-center justify-center gap-2 border-(length:--borde) border-ink rounded-theme bg-primary-green px-3 py-2.5 text-[13px] font-semibold text-ink-strong shadow-marco-sm transition-[transform,filter] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
          >
            <IconoCamara />
            {subiendo ? t("subiendoFoto") : t("cambiarFoto")}
          </button>

          {perfil.fotoUrl ? (
            <BotonConfirmar
              titulo={t("quitarFoto")}
              mensaje={t("quitarFotoConfirmar")}
              textoConfirmar={t("quitarFoto")}
              etiqueta={t("quitarFoto")}
              onConfirmar={() => void quitar()}
              className="flex items-center justify-center gap-2 border-(length:--borde) border-dashed border-ink rounded-theme px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-secondary-purple/10"
            >
              <IconoQuitar />
              {t("quitarFoto")}
            </BotonConfirmar>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="border-(length:--borde) border-ink rounded-theme bg-primary-pink px-3 py-2 text-sm text-ink-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}
