import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { Caveat, Inter, Lora, Nunito, Silkscreen, Special_Elite } from "next/font/google";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SCRIPT_MODO } from "@/lib/temas/modo";
import "./globals.css";

/*
 * Las tres fuentes aparecen arriba del pliegue en casi todas las pantallas,
 * por eso las tres se precargan: Silkscreen en la barra de navegación y los
 * botones, Lora en el título grande de cada sección (el texto más grande de
 * la pantalla, el que el navegador mide como LCP) e Inter en todo lo demás.
 * `display: "swap"` en las tres: la página se pinta enseguida con un respaldo
 * de medidas ajustadas (`adjustFontFallback`, activo por defecto) y la fuente
 * real entra sin mover el layout; "optional" dejaría la primera visita en un
 * celular lento con la fuente de respaldo — y eso sí cambia el look.
 *
 * Solo `latin`: cubre U+0000-00FF, o sea tildes, ñ, ü, ¿ y ¡, más la raya
 * (—) y las comillas tipográficas del rango U+2000-206F.
 */

// Variable a propósito (sin `weight`): Google sirve el mismo archivo variable
// de ~48 KB aunque se pidan pesos sueltos, así que recortar pesos no ahorra
// nada y la interfaz usa 400, 500 y 600.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

// Variable (400–700, un solo archivo de ~38 KB): los títulos usan 600 y 700 y
// el cuerpo del diario 400. Solo estilo normal: la cursiva de citas y énfasis
// la sintetiza el navegador, como hasta ahora; pedir la real sumaría ~40 KB.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  // Android no trae Times New Roman (base del respaldo ajustado), así que sin
  // esto caía en la fuente por defecto del navegador mientras carga.
  fallback: ["Georgia", "serif"],
});

// Solo 400: ningún texto pixelado va en negrita (ni `font-bold` ni <strong>
// dentro de `font-pixel`), así que el 700 era un archivo precargado de más.
const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  // Mismo respaldo que declara el tema Retro (src/lib/temas/presets.ts): el
  // ancho de una monoespaciada se parece al de los glifos pixelados, así el
  // salto al cargar es mínimo donde no existe el Arial del respaldo ajustado.
  fallback: ["monospace"],
});

/*
 * Las que se pueden elegir en Personalización → Tipografía
 * (src/lib/temas/fuentes.ts). Sin precarga: casi nadie las usa a la vez, y
 * el navegador solo baja una si el tema activo la pide.
 */
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
  fallback: ["Courier New", "monospace"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Cuarto Propio",
  description: "Diario, listas, vitrina y audio — tu espacio personal.",
  // iOS no lee los íconos del manifest: necesita su propio apple-touch-icon
  // y la marca de "app web" para abrirse a pantalla completa al instalarla.
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Cuarto Propio", statusBarStyle: "default" },
};

/** El color de la barra del sistema en el celular: el morado de la barra de
 * la app, para que se vean como una sola pieza. */
export const viewport: Viewport = {
  themeColor: "#5B3F73",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${lora.variable} ${silkscreen.variable} ${caveat.variable} ${specialElite.variable} ${nunito.variable} h-full antialiased`}
      // El script de abajo le escribe `data-modo` a este mismo elemento antes
      // de que React hidrate: sin esto React lo tomaría por un desajuste.
      suppressHydrationWarning
    >
      <head>
        {/* Corre mientras el navegador todavía está parseando el HTML, así el
            modo oscuro elegido a mano ya está puesto en el primer pintado y
            la página no aparece clara por un instante. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_MODO }} />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
