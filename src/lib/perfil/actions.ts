"use server";

import { createClient } from "@/lib/supabase/server";
import { NOMBRE_MAXIMO } from "./limites";

/**
 * El nombre es opcional: vacío se guarda como NULL y el avatar cae al
 * monograma del email. `upsert` y no `update` porque la fila de perfil
 * puede no existir todavía (ver `obtenerPerfil`).
 */
export async function renombrarPerfil(nombre: string) {
  const limpio = nombre.trim().slice(0, NOMBRE_MAXIMO);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("perfiles")
    .upsert({ id: user.id, nombre: limpio || null }, { onConflict: "id" });

  if (error) throw error;
}

/** Cierra el mensaje de bienvenida para siempre (en esta cuenta, en todos
 * sus dispositivos). */
export async function marcarBienvenidaVista() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("perfiles")
    .upsert({ id: user.id, bienvenida_vista_en: new Date().toISOString() }, { onConflict: "id" });

  if (error) throw error;
}
