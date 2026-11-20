"use client";

import { createContext, useContext } from "react";
import type { ConfigIconos } from "@/lib/temas/config";
import { ICONO_SECCION, ICONO_SECCION_PIXEL, type RutaSeccion } from "./iconos-secciones";

const IconosContexto = createContext<ConfigIconos>({ set: "trazo", propios: {} });

/** Los iconos elegidos en Personalización, para toda la app. Lo pone el
 * layout de la app con la configuración del tema activo. */
export function IconosProvider({ valor, children }: { valor: ConfigIconos; children: React.ReactNode }) {
  return <IconosContexto.Provider value={valor}>{children}</IconosContexto.Provider>;
}

/**
 * El icono de una sección según lo que eligió la usuaria: su propia imagen
 * si subió una para esa sección, si no el del set elegido (trazo o pixel).
 */
export function IconoSeccion({ ruta, tamano = 24 }: { ruta: RutaSeccion; tamano?: number }) {
  const { set, propios } = useContext(IconosContexto);
  const propia = propios[ruta];
  if (propia) {
    return (
      // Imagen propia ya reducida a 64 px por el servidor (data: PNG); el
      // optimizador de Next no aporta nada acá.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={propia} alt="" width={tamano} height={tamano} className="shrink-0 object-contain" />
    );
  }
  const Icono = (set === "pixel" ? ICONO_SECCION_PIXEL : ICONO_SECCION)[ruta];
  return <Icono tamano={tamano} />;
}
