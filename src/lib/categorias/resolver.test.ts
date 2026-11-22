import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { claveCategoria, resolverCategoriaId } from "./resolver";

/** Supabase falso: `existentes` son las categorías de la usuaria. */
function falso(existentes: { id: string; nombre: string }[], errorBusqueda: unknown = null) {
  const insert = vi.fn(() => ({
    select: () => ({ single: async () => ({ data: { id: "nueva" }, error: null }) }),
  }));
  const select = vi.fn(() => ({
    eq: () => ({ order: async () => ({ data: existentes, error: errorBusqueda }) }),
  }));
  const supabase = { from: vi.fn(() => ({ select, insert })) } as unknown as SupabaseClient;
  return { supabase, insert };
}

describe("claveCategoria", () => {
  it("ignora mayúsculas y espacios de más", () => {
    expect(claveCategoria("  Viajes  de   Verano ")).toBe(claveCategoria("viajes de verano"));
    expect(claveCategoria("ÑANDÚ")).toBe("ñandú");
  });
});

describe("resolverCategoriaId", () => {
  it("devuelve null sin tocar la base si el nombre está vacío", async () => {
    const { supabase } = falso([]);
    expect(await resolverCategoriaId(supabase, "u", "   ")).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it("reusa la categoría que ya existe", async () => {
    const { supabase, insert } = falso([{ id: "abc", nombre: "Viajes" }]);
    expect(await resolverCategoriaId(supabase, "u", " Viajes ")).toBe("abc");
    expect(insert).not.toHaveBeenCalled();
  });
  it("no distingue mayúsculas: «viajes» reusa «Viajes»", async () => {
    const { supabase, insert } = falso([{ id: "abc", nombre: "Viajes" }]);
    expect(await resolverCategoriaId(supabase, "u", "VIAJES")).toBe("abc");
    expect(insert).not.toHaveBeenCalled();
  });
  it("con duplicadas de antes, gana la más vieja (la primera)", async () => {
    const { supabase } = falso([
      { id: "vieja", nombre: "Viajes" },
      { id: "nueva-dup", nombre: "viajes" },
    ]);
    expect(await resolverCategoriaId(supabase, "u", "viajes")).toBe("vieja");
  });
  it("crea la categoría si no existe, con el nombre recortado", async () => {
    const { supabase, insert } = falso([{ id: "abc", nombre: "Libros" }]);
    expect(await resolverCategoriaId(supabase, "u", " Viajes ")).toBe("nueva");
    expect(insert).toHaveBeenCalledWith({ usuario_id: "u", nombre: "Viajes" });
  });
  it("propaga el error de la búsqueda", async () => {
    const { supabase } = falso([], new Error("boom"));
    await expect(resolverCategoriaId(supabase, "u", "x")).rejects.toThrow("boom");
  });
});
