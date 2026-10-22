import Image from "next/image";
import type { PerfilVisible } from "@/lib/perfil/types";

const TAMANOS = {
  nav: { px: 32, texto: "text-sm" },
  panel: { px: 72, texto: "text-2xl" },
} as const;

/**
 * La carita de la usuaria: su foto si subió una, o el monograma de su nombre
 * (o de su email) si no. Nunca un hueco gris — el avatar es el botón que
 * abre el perfil, así que siempre tiene que verse como algo tocable.
 */
export function Avatar({
  perfil,
  tamano = "nav",
}: {
  perfil: PerfilVisible;
  tamano?: keyof typeof TAMANOS;
}) {
  const { px, texto } = TAMANOS[tamano];
  const inicial = (perfil.nombre?.trim() || perfil.email?.trim() || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-ink bg-primary-pink"
      style={{ width: px, height: px }}
    >
      {perfil.fotoUrl ? (
        <Image
          src={perfil.fotoUrl}
          alt=""
          width={px}
          height={px}
          className="h-full w-full object-cover"
          // Sin el optimizador de Next: el pipeline ya la dejó como un
          // cuadrado WebP de 160 px pensado para estos dos tamaños (ver
          // `MINIATURAS` en `src/lib/imagenes/procesar.ts`), y la URL firmada
          // se renueva cada pocas horas, así que una versión optimizada
          // dejaría de servir enseguida.
          unoptimized
          // La de la barra se ve siempre, arriba de todo: se pide ya, sin
          // esperar al primer dibujado. La del panel vive dentro de un
          // <dialog> cerrado y es el mismo archivo, así que puede esperar.
          loading={tamano === "nav" ? "eager" : "lazy"}
        />
      ) : (
        <span className={`font-pixel ${texto} leading-none text-ink-strong`}>{inicial}</span>
      )}
    </span>
  );
}
