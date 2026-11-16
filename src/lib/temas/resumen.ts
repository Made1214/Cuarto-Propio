import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ResumenCuarto = {
  entradas: number;
  piezas: number;
  notas: number;
  listas: number;
  ultimaNota: { titulo: string | null; duracion: number | null } | null;
};

async function contar(tabla: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from(tabla).select("id", { count: "exact", head: true });
  return count ?? 0;
}

/**
 * Lo que muestran los paneles decorativos de los temas Softsignal y Void
 * ("tu cuarto": cuántas entradas, piezas, notas y listas hay, y la última nota
 * de audio). Son datos reales, no adorno inventado. RLS ya limita todo a la
 * cuenta de quien pide. Si algo falla, cuenta cero: es decoración.
 */
export const obtenerResumenCuarto = cache(async (): Promise<ResumenCuarto> => {
  try {
    const supabase = await createClient();
    const [entradas, piezas, notas, listas, ultima] = await Promise.all([
      contar("entradas"),
      contar("imagenes"),
      contar("audios"),
      contar("listas"),
      supabase.from("audios").select("titulo, duracion_segundos").order("fecha", { ascending: false }).limit(1).maybeSingle(),
    ]);
    return {
      entradas,
      piezas,
      notas,
      listas,
      ultimaNota: ultima.data
        ? { titulo: (ultima.data.titulo as string | null) ?? null, duracion: (ultima.data.duracion_segundos as number | null) ?? null }
        : null,
    };
  } catch {
    return { entradas: 0, piezas: 0, notas: 0, listas: 0, ultimaNota: null };
  }
});
