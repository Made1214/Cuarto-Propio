import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

/**
 * Row Level Security con DOS cuentas, directo contra la base (sin navegador):
 * lo que crea la cuenta A no lo puede leer, cambiar ni borrar la cuenta B,
 * tampoco sus archivos de Storage. Es lo que hay que comprobar antes de abrir
 * el registro a otras personas.
 *
 * Necesita dos cuentas de prueba ya confirmadas, más la URL y la clave
 * pública de Supabase (se leen de `.env.local` si no están en el entorno):
 *
 *   E2E_EMAIL=a@... E2E_PASSWORD=... E2E_EMAIL_2=b@... E2E_PASSWORD_2=... \
 *     npx playwright test e2e/rls.spec.ts --project=escritorio
 *
 * Lo que crea lo borra al terminar (con la cuenta A).
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin `.env.local`: se usan las variables del entorno.
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const A = { email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD };
const B = { email: process.env.E2E_EMAIL_2, password: process.env.E2E_PASSWORD_2 };

test.skip(
  !URL || !CLAVE || !A.email || !A.password || !B.email || !B.password,
  "Faltan NEXT_PUBLIC_SUPABASE_URL/ANON_KEY y las dos cuentas (E2E_EMAIL[_2], E2E_PASSWORD[_2])",
);

async function cliente(cuenta: { email?: string; password?: string }) {
  const supabase = createClient(URL!, CLAVE!, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cuenta.email!,
    password: cuenta.password!,
  });
  if (error) throw error;
  return { supabase, id: data.user.id };
}

test.describe("RLS con dos cuentas", () => {
  let a: { supabase: SupabaseClient; id: string };
  let b: { supabase: SupabaseClient; id: string };
  const sufijo = Date.now().toString(36);
  const creado: { entrada?: string; lista?: string; categoria?: string; archivo?: string } = {};

  test.beforeAll(async () => {
    a = await cliente(A);
    b = await cliente(B);
    expect(a.id).not.toBe(b.id);

    const categoria = await a.supabase
      .from("categorias")
      .insert({ usuario_id: a.id, nombre: `E2E rls ${sufijo}` })
      .select("id")
      .single();
    if (categoria.error) throw categoria.error;
    creado.categoria = categoria.data.id;

    const entrada = await a.supabase
      .from("entradas")
      .insert({
        usuario_id: a.id,
        titulo: `E2E rls ${sufijo}`,
        contenido: { type: "doc", content: [] },
        categoria_id: creado.categoria,
      })
      .select("id")
      .single();
    if (entrada.error) throw entrada.error;
    creado.entrada = entrada.data.id;

    const lista = await a.supabase
      .from("listas")
      .insert({ usuario_id: a.id, nombre: `E2E rls ${sufijo}` })
      .select("id")
      .single();
    if (lista.error) throw lista.error;
    creado.lista = lista.data.id;

    const items = await a.supabase.from("items_lista").insert({ lista_id: creado.lista, contenido: "secreto", orden: 0 });
    if (items.error) throw items.error;

    creado.archivo = `${a.id}/e2e-rls-${sufijo}.txt`;
    const subida = await a.supabase.storage
      .from("imagenes")
      .upload(creado.archivo, new Blob(["secreto"], { type: "text/plain" }));
    // El bucket puede rechazar texto plano por tipo; entonces no hay archivo
    // que probar y esa parte se salta.
    if (subida.error) creado.archivo = undefined;
  });

  test.afterAll(async () => {
    if (!a) return;
    if (creado.archivo) await a.supabase.storage.from("imagenes").remove([creado.archivo]);
    if (creado.lista) await a.supabase.from("listas").delete().eq("id", creado.lista);
    if (creado.entrada) await a.supabase.from("entradas").delete().eq("id", creado.entrada);
    if (creado.categoria) await a.supabase.from("categorias").delete().eq("id", creado.categoria);
  });

  test("B no ve nada de A", async () => {
    for (const tabla of ["entradas", "listas", "categorias", "imagenes", "audios", "temas"]) {
      const { data, error } = await b.supabase.from(tabla).select("id").eq("usuario_id", a.id);
      expect(error, tabla).toBeNull();
      expect(data, tabla).toEqual([]);
    }
    const items = await b.supabase.from("items_lista").select("id").eq("lista_id", creado.lista!);
    expect(items.data).toEqual([]);
    const perfil = await b.supabase.from("perfiles").select("id").eq("id", a.id);
    expect(perfil.data).toEqual([]);
  });

  test("B no puede cambiar ni borrar lo de A", async () => {
    const cambio = await b.supabase
      .from("entradas")
      .update({ titulo: "tocado por B" })
      .eq("id", creado.entrada!)
      .select("id");
    expect(cambio.data ?? []).toEqual([]);

    const borrado = await b.supabase.from("listas").delete().eq("id", creado.lista!).select("id");
    expect(borrado.data ?? []).toEqual([]);

    // A sigue viendo lo suyo intacto.
    const entrada = await a.supabase.from("entradas").select("titulo").eq("id", creado.entrada!).single();
    expect(entrada.data?.titulo).toBe(`E2E rls ${sufijo}`);
    const lista = await a.supabase.from("listas").select("id").eq("id", creado.lista!);
    expect(lista.data).toHaveLength(1);
  });

  test("B no puede crear filas a nombre de A", async () => {
    const intento = await b.supabase.from("entradas").insert({
      usuario_id: a.id,
      titulo: "a nombre de otra",
      contenido: { type: "doc", content: [] },
    });
    expect(intento.error).not.toBeNull();

    const item = await b.supabase.from("items_lista").insert({ lista_id: creado.lista!, contenido: "intruso", orden: 1 });
    expect(item.error).not.toBeNull();
  });

  test("B no puede leer, subir ni borrar en la carpeta de A en Storage", async () => {
    if (creado.archivo) {
      const descarga = await b.supabase.storage.from("imagenes").download(creado.archivo);
      expect(descarga.data).toBeNull();
      await b.supabase.storage.from("imagenes").remove([creado.archivo]);
      const sigue = await a.supabase.storage.from("imagenes").download(creado.archivo);
      expect(sigue.data).not.toBeNull();
    }
    const subida = await b.supabase.storage
      .from("audios")
      .upload(`${a.id}/intruso-${sufijo}.webm`, new Blob(["x"], { type: "audio/webm" }));
    expect(subida.error).not.toBeNull();
  });
});
