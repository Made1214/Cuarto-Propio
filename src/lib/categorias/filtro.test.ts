import { beforeEach, describe, expect, it, vi } from "vitest";

const cats = [{ id: "11111111-1111-4111-8111-111111111111", nombre: "Viajes" }];
vi.mock("./queries", () => ({ listarCategorias: vi.fn(async () => cats) }));

import { listarConFiltroCategoria } from "./filtro";

describe("listarConFiltroCategoria", () => {
  const listar = vi.fn(async (id: string | undefined) => `lista:${id ?? "todas"}`);
  beforeEach(() => listar.mockClear());

  it("sin parámetro lista todo", async () => {
    const r = await listarConFiltroCategoria(undefined, listar);
    expect(r).toEqual({ categorias: cats, categoriaActual: null, resultado: "lista:todas" });
  });
  it("filtra por una categoría que existe", async () => {
    const r = await listarConFiltroCategoria(cats[0].id, listar);
    expect(r.categoriaActual).toEqual(cats[0]);
    expect(r.resultado).toBe(`lista:${cats[0].id}`);
  });
  it("ignora lo que no tiene forma de uuid, sin consulta extra", async () => {
    const r = await listarConFiltroCategoria("hola", listar);
    expect(r.categoriaActual).toBeNull();
    expect(listar).toHaveBeenCalledTimes(1);
    expect(listar).toHaveBeenCalledWith(undefined);
  });
  it("ignora un array (?categoria=a&categoria=b)", async () => {
    const r = await listarConFiltroCategoria([cats[0].id, cats[0].id], listar);
    expect(r.categoriaActual).toBeNull();
  });
  it("un uuid de categoría inexistente vuelve a listar todo", async () => {
    const r = await listarConFiltroCategoria("22222222-2222-4222-8222-222222222222", listar);
    expect(r.categoriaActual).toBeNull();
    expect(r.resultado).toBe("lista:todas");
    expect(listar).toHaveBeenCalledTimes(2);
  });
});
