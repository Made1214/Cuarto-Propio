import { Cormorant_Garamond, Pirata_One } from "next/font/google";

/*
 * Letras que solo usa la landing (temas Fairy y Emo). Viven acá y no en el
 * layout para que solo las declare esta página. Sin `preload`: la landing
 * abre en Whimsical, así que se bajan recién cuando aparece una sección Fairy
 * o Emo, no en la primera carga.
 */
export const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});

export const pirata = Pirata_One({
  variable: "--font-pirata",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
