import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export { LIMITE_STORAGE_BYTES, UMBRAL_AVISO_STORAGE } from "./limites";

/**
 * Bytes que ocupan las fotos y audios de quien está adentro (función
 * `uso_storage`, migración 0010), o `null` si no se pudo saber — por ejemplo,
 * si la migración todavía no está aplicada. Con `null` simplemente no se
 * muestra nada: un medidor que falta no debe romper la app.
 *
 * `cache` porque en una misma página lo piden el aviso del layout y el
 * panel de perfil.
 */
export const obtenerUsoStorage = cache(async (): Promise<number | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("uso_storage");
  if (error) return null;
  return Number(data ?? 0);
});
