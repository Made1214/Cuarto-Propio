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
      tinta: "rgba(91,63,115,0.14)",
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
      tinta: "rgba(251,244,242,0.12)",
      tintaFuerte: "#3D2C4F",
      primarioVerde: "#B8E0C6",
      primarioRosa: "#F5C4D3",
      secundarioTurquesa: "#8ED9D4",
      secundarioMorado: "#8A6BA3",
    },
  },
  fuenteDiario: "'Lora', Georgia, serif",
  fuenteInterfaz: "'Inter', system-ui, sans-serif",
  radio: "999px",
  anchoBorde: "1px",
  sombra: "suave",
};

/**
 * Tema retro: ventanas de escritorio Y2K (Windows 98 / DreamWorld OS),
 * bordes gruesos, sombra sólida desplazada sin blur, tipografía pixelada
 * en toda la interfaz — el diario se queda en la fuente literaria para
 * que lo escrito siga siendo cómodo de leer.
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
  fuenteDiario: "'Lora', Georgia, serif",
  fuenteInterfaz: "'Silkscreen', monospace",
  radio: "6px",
  anchoBorde: "2px",
  sombra: "dura",
  sombraOffset: "5px",
};

/** Temas con tokens ya definidos — lo único que existe hoy como opción real. */
export const TEMAS_DISPONIBLES: Record<string, TemaDiseno> = {
  whimsical,
  retro,
};

export const TEMA_POR_DEFECTO = whimsical;

/**
 * Temas con nombre ya decididos (ver conversación de diseño), todavía sin
 * tokens definidos. El id queda reservado acá para cuando se diseñen y se
 * agreguen a TEMAS_DISPONIBLES — no son seleccionables todavía.
 */
export const TEMAS_PLANEADOS = [
  { id: "fairy", vibra: "Pastel soñado: cursiva, brillos, gradientes suaves." },
  { id: "emo", vibra: "Oscuro y dramático: tipografía gótica, alto contraste, acentos en rojo/negro." },
] as const;
