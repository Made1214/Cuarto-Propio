import type { TemaDiseno } from "./types";

/**
 * Tema de fábrica: la paleta confirmada en CLAUDE.md ("Identidad visual"),
 * estética whimsical inspirada en blogspot. Es el punto de partida — los
 * demás temas pueden alejarse tanto como quieran del "lenguaje de forma"
 * (bordes, sombra, tipografía), pero casi todos reusan esta misma paleta de
 * color base en sus variantes claro/oscuro.
 */
const whimsical: TemaDiseno = {
  id: "whimsical",
  nombre: "Whimsical",
  descripcion: "El tema de fábrica: pastel, cálido, inspirado en blogspot.",
  colores: {
    claro: {
      fondo: "#FCF6F3",
      fondoTarjeta: "#FFFFFF",
      texto: "#3D2C4F",
      textoMuted: "rgba(61,44,79,0.62)",
      tinta: "#3D2C4F",
      tintaFuerte: "#3D2C4F",
      primarioVerde: "#9BCFAE",
      primarioRosa: "#F0AEC4",
      secundarioTurquesa: "#74C7C3",
      secundarioMorado: "#5B3F73",
    },
    oscuro: {
      fondo: "#2B2033",
      fondoTarjeta: "#43334F",
      texto: "#FBF4F2",
      textoMuted: "rgba(251,244,242,0.62)",
      tinta: "#FBF4F2",
      tintaFuerte: "#3D2C4F",
      primarioVerde: "#B8E0C6",
      primarioRosa: "#F5C4D3",
      secundarioTurquesa: "#8ED9D4",
      secundarioMorado: "#8A6BA3",
    },
  },
  fuenteDiario: "lora",
  fuenteInterfaz: "inter",
  // Cajas redondeadas (no píldora entera: en una tarjeta de diario o una
  // ventanita, 999px la deformaba) y borde fino de la misma tinta que el
  // texto, para que se lea igual de bien que Retro.
  radio: "16px",
  anchoBorde: "1px",
  sombra: "suave",
};

/**
 * Tema retro: ventanas de escritorio Y2K (Windows 98 / DreamWorld OS),
 * bordes gruesos, esquinas rectas, sombra sólida desplazada sin blur. Es el
 * look por defecto de la app desde el rediseño UX.
 *
 * La fuente pixelada (Silkscreen) queda para la marca y los rótulos cortos
 * (clase `font-pixel`); la interfaz va en Inter porque en botones y
 * navegación de 10–12 px el pixel costaba leerlo. Quien la quiera en toda la
 * interfaz la elige en Personalización → Tipografía.
 * Prototipado en: https://claude.ai/artifact/CmEHbvcrAWAxnaUN2tRjK3
 */
const retro: TemaDiseno = {
  id: "retro",
  nombre: "Retro",
  descripcion: "Ventanas de escritorio Y2K, bordes gruesos, sombra dura, tipografía pixelada.",
  colores: {
    claro: {
      fondo: "#FCF6F3",
      fondoTarjeta: "#FFFFFF",
      texto: "#3D2C4F",
      textoMuted: "rgba(61,44,79,0.62)",
      tinta: "#3D2C4F",
      tintaFuerte: "#3D2C4F",
      primarioVerde: "#9BCFAE",
      primarioRosa: "#F0AEC4",
      secundarioTurquesa: "#74C7C3",
      secundarioMorado: "#5B3F73",
    },
    oscuro: {
      fondo: "#2B2033",
      fondoTarjeta: "#43334F",
      texto: "#FBF4F2",
      textoMuted: "rgba(251,244,242,0.62)",
      tinta: "#FBF4F2",
      tintaFuerte: "#3D2C4F",
      primarioVerde: "#B8E0C6",
      primarioRosa: "#F5C4D3",
      secundarioTurquesa: "#8ED9D4",
      secundarioMorado: "#C9A8E0",
    },
  },
  fuenteDiario: "lora",
  fuenteInterfaz: "inter",
  radio: "0px",
  anchoBorde: "2px",
  sombra: "dura",
  sombraOffset: "4px",
};

/** Temas con tokens ya definidos — lo único que existe hoy como opción real. */
export const TEMAS_DISPONIBLES = {
  retro,
  whimsical,
} satisfies Record<string, TemaDiseno>;

/** El tema de quien todavía no eligió ninguno: el look actual de la app. */
export const TEMA_POR_DEFECTO = retro;

export type PresetId = keyof typeof TEMAS_DISPONIBLES;

export function esPreset(valor: unknown): valor is PresetId {
  return typeof valor === "string" && valor in TEMAS_DISPONIBLES;
}

/**
 * Temas con nombre ya decididos (ver conversación de diseño), todavía sin
 * tokens definidos. El id queda reservado acá para cuando se diseñen y se
 * agreguen a TEMAS_DISPONIBLES — no son seleccionables todavía.
 */
export const TEMAS_PLANEADOS = [
  { id: "fairy", vibra: "Pastel soñado: cursiva, brillos, gradientes suaves." },
  { id: "emo", vibra: "Oscuro y dramático: tipografía gótica, alto contraste, acentos en rojo/negro." },
] as const;
