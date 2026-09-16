-- Cuarto Propio — buckets de Storage para fotos y audio.
--
-- Privados por defecto: se sirven con URLs firmadas, filtrando siempre
-- por carpeta `usuario_id/...` dentro del bucket.

insert into storage.buckets (id, name, public)
values
  ('imagenes', 'imagenes', false),
  ('audios', 'audios', false)
on conflict (id) do nothing;

create policy "imagenes: dueño lee sus archivos" on storage.objects
  for select using (
    bucket_id = 'imagenes' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "imagenes: dueño sube sus archivos" on storage.objects
  for insert with check (
    bucket_id = 'imagenes' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "imagenes: dueño borra sus archivos" on storage.objects
  for delete using (
    bucket_id = 'imagenes' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "audios: dueño lee sus archivos" on storage.objects
  for select using (
    bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "audios: dueño sube sus archivos" on storage.objects
  for insert with check (
    bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "audios: dueño borra sus archivos" on storage.objects
  for delete using (
    bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text
  );
