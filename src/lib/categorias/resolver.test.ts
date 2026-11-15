import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { resolverCategoriaId } from "./resolver";

/** Supabase falso: `existente` es lo que devuelve la búsqueda. */
function falso(existente: { id: string } | null, errorBusqueda: unknown = null) {
  const insert = vi.fn(() => ({
    select: () => ({ single: async () => ({ data: { id: "nueva" }, error: null }) }),
  }));
  const select = vi.fn(() => ({
    eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existente, error: errorBusqueda }) }) }),
  }));
  const supabase = { from: vi.fn(() => ({ select, insert })) } as unknown as SupabaseClient;
  return { supabase, insert };
}

describe("resolverCategoriaId", () => {
  it("devuelve null sin tocar la base si el nombre está vacío", async () => {
    const { supabase } = falso(null);
    expect(await resolverCategoriaId(supabase, "u", "   ")).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it("reusa la categoría que ya existe", async () => {
    const { supabase, insert } = falso({ id: "abc" });
    expect(await resolverCategoriaId(supabase, "u", " Viajes ")).toBe("abc");
    expect(insert).not.toHaveBeenCalled();
  });
  it("crea la categoría si no existe, con el nombre recortado", async () => {
    const { supabase, insert } = falso(null);
    expect(await resolverCategoriaId(supabase, "u", " Viajes ")).toBe("nueva");
    expect(insert).toHaveBeenCalledWith({ usuario_id: "u", nombre: "Viajes" });
  });
  it("propaga el error de la búsqueda", async () => {
    const { supabase } = falso(null, new Error("boom"));
    await expect(resolverCategoriaId(supabase, "u", "x")).rejects.toThrow("boom");
  });
});
