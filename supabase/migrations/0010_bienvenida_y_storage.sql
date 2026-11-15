-- Dos piezas chicas de la Fase 1:
--
-- 1. Bienvenida (CLAUDE.md → Usabilidad: "un mensaje de bienvenida al primer
--    inicio de sesión, no un tour"). Se guarda en la cuenta y no en el
--    navegador: si no, volvería a aparecer en cada dispositivo nuevo.
--
-- 2. Cuánto Storage ocupa cada usuaria (CLAUDE.md → Escalabilidad: avisar
--    antes de llegar al límite del free tier).

alter table public.perfiles
  add column if not exists bienvenida_vista_en timestamptz;

comment on column public.perfiles.bienvenida_vista_en is
  'Cuándo cerró el mensaje de bienvenida. Null = todavía no lo vio.';

-- Bytes que ocupan los archivos propios (fotos y audios). Las rutas de los
-- dos buckets empiezan por el usuario_id, que es lo que ya filtran las
-- políticas de Storage. `security definer` porque `storage.objects` no se
-- expone por la API; igual solo cuenta lo de quien llama (`auth.uid()`).
create or replace function public.uso_storage()
returns bigint
language sql
stable
security definer
set search_path = public, storage
as $$
  select coalesce(sum((metadata ->> 'size')::bigint), 0)
  from storage.objects
  where bucket_id in ('imagenes', 'audios')
    and (storage.foldername(name))[1] = auth.uid()::text;
$$;

revoke all on function public.uso_storage() from public;
grant execute on function public.uso_storage() to authenticated;
