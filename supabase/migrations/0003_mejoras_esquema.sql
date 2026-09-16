-- Cuarto Propio — endurecimiento del esquema antes de construir los módulos.

-- ─────────────────────────────────────────────────────────────────
-- updated_at automático
-- ─────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.entradas;
create trigger set_updated_at
  before update on public.entradas
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.perfiles;
create trigger set_updated_at
  before update on public.perfiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- Búsqueda por palabra clave en el diario
--
-- `contenido` (jsonb) sigue siendo la fuente de verdad para el editor.
-- `contenido_texto` es el texto plano equivalente, que la app escribe
-- junto con `contenido` en cada guardado (ej. con generateText de
-- Tiptap). `busqueda` se deriva solo de eso, así no hay que parsear
-- JSON de Tiptap en SQL.
-- ─────────────────────────────────────────────────────────────────
alter table public.entradas
  add column if not exists contenido_texto text not null default '';

alter table public.entradas
  add column if not exists busqueda tsvector
  generated always as (
    to_tsvector('spanish', coalesce(titulo, '') || ' ' || coalesce(contenido_texto, ''))
  ) stored;

create index if not exists entradas_busqueda_idx
  on public.entradas using gin (busqueda);

-- ─────────────────────────────────────────────────────────────────
-- Índices en foreign keys usadas para filtrar por categoría
-- ─────────────────────────────────────────────────────────────────
create index if not exists entradas_categoria_idx on public.entradas (categoria_id);
create index if not exists imagenes_categoria_idx on public.imagenes (categoria_id);
create index if not exists audios_categoria_idx on public.audios (categoria_id);

-- ─────────────────────────────────────────────────────────────────
-- Storage: restringir explícitamente las políticas a usuarios autenticados
-- ─────────────────────────────────────────────────────────────────
alter policy "imagenes: dueño lee sus archivos" on storage.objects to authenticated;
alter policy "imagenes: dueño sube sus archivos" on storage.objects to authenticated;
alter policy "imagenes: dueño borra sus archivos" on storage.objects to authenticated;
alter policy "audios: dueño lee sus archivos" on storage.objects to authenticated;
alter policy "audios: dueño sube sus archivos" on storage.objects to authenticated;
alter policy "audios: dueño borra sus archivos" on storage.objects to authenticated;
