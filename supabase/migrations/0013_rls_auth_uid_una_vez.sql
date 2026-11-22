-- RLS: `auth.uid()` se evalúa una vez por consulta, no una vez por fila.
--
-- Las políticas de 0001 comparaban `usuario_id = auth.uid()`. Postgres no
-- sabe que `auth.uid()` da lo mismo en toda la consulta y la vuelve a llamar
-- en cada fila; con cientos de entradas se nota. Envuelta en `(select …)`, el
-- planificador la calcula una sola vez (un "initplan") y compara contra ese
-- valor. Es lo que pide el aviso `auth_rls_initplan` del Security/Performance
-- Advisor de Supabase, y lo que recomienda su guía:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- No cambia QUIÉN ve qué: las condiciones son las mismas. `alter policy`
-- reemplaza la condición en el lugar, sin un instante sin política.

alter policy "perfiles: dueño" on public.perfiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy "categorias: dueño" on public.categorias
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

alter policy "entradas: dueño" on public.entradas
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

alter policy "listas: dueño" on public.listas
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

alter policy "items_lista: dueño" on public.items_lista
  using (
    exists (
      select 1 from public.listas
      where listas.id = items_lista.lista_id
        and listas.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.listas
      where listas.id = items_lista.lista_id
        and listas.usuario_id = (select auth.uid())
    )
  );

alter policy "imagenes: dueño" on public.imagenes
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

alter policy "audios: dueño" on public.audios
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

alter policy "temas: dueño" on public.temas
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- Storage: mismas carpetas por usuaria (`<usuario_id>/…`), mismo arreglo.

alter policy "imagenes: dueño lee sus archivos" on storage.objects
  using (bucket_id = 'imagenes' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "imagenes: dueño sube sus archivos" on storage.objects
  with check (bucket_id = 'imagenes' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "imagenes: dueño borra sus archivos" on storage.objects
  using (bucket_id = 'imagenes' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "audios: dueño lee sus archivos" on storage.objects
  using (bucket_id = 'audios' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "audios: dueño sube sus archivos" on storage.objects
  with check (bucket_id = 'audios' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "audios: dueño borra sus archivos" on storage.objects
  using (bucket_id = 'audios' and (storage.foldername(name))[1] = (select auth.uid())::text);
