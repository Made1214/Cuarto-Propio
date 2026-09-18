-- Cuarto Propio — esquema completo (Fase 1)
--
-- Toda tabla de contenido lleva `usuario_id` y las políticas de RLS
-- siempre filtran por ese campo. Hoy solo existe un usuario real, pero
-- esto es justo lo que permite pasar a multiusuario más adelante sin
-- tocar la estructura de datos (ver Fase 2 en CLAUDE.md).
--
-- Un solo archivo, sin historial de pasos intermedios: el proyecto
-- todavía no corrió contra una base de datos real, así que no hace
-- falta preservar migraciones separadas. De acá en adelante, cualquier
-- cambio de esquema se agrega como un archivo nuevo (0002_..., 0003_...),
-- nunca editando este.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────
-- Perfiles (extiende auth.users con datos propios del producto)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  foto_perfil_path text,
  tema_activo_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────
-- Categorías (propias de cada usuario, no globales)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now(),
  unique (usuario_id, nombre)
);

-- ─────────────────────────────────────────────────────────────────
-- Diario: entradas con contenido enriquecido (JSON de Tiptap)
--
-- `contenido` (jsonb) es la fuente de verdad para el editor.
-- `contenido_texto` es el texto plano equivalente, que la app escribe
-- junto con `contenido` en cada guardado (ej. con generateText de
-- Tiptap). `busqueda` se deriva solo de eso, así no hay que parsear
-- JSON de Tiptap en SQL.
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.entradas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  titulo text,
  contenido jsonb not null default '{}'::jsonb,
  contenido_texto text not null default '',
  busqueda tsvector generated always as (
    to_tsvector('spanish', coalesce(titulo, '') || ' ' || coalesce(contenido_texto, ''))
  ) stored,
  fecha timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entradas_usuario_fecha_idx
  on public.entradas (usuario_id, fecha desc);

create index if not exists entradas_categoria_idx on public.entradas (categoria_id);

create index if not exists entradas_busqueda_idx
  on public.entradas using gin (busqueda);

-- ─────────────────────────────────────────────────────────────────
-- Listas y sus ítems (checklist simple: texto + marcado)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.listas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  nombre text not null,
  created_at timestamptz not null default now()
);

create index if not exists listas_categoria_idx on public.listas (categoria_id);

create table if not exists public.items_lista (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid not null references public.listas (id) on delete cascade,
  contenido text not null,
  marcado boolean not null default false,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists items_lista_lista_idx
  on public.items_lista (lista_id, orden);

-- ─────────────────────────────────────────────────────────────────
-- Galería: imágenes con miniatura + versión completa (procesadas con sharp)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.imagenes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  titulo text,
  descripcion text,
  hashtags text[] not null default '{}',
  miniatura_path text not null,
  completa_path text not null,
  ancho integer,
  alto integer,
  fecha timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists imagenes_usuario_fecha_idx
  on public.imagenes (usuario_id, fecha desc);

create index if not exists imagenes_categoria_idx on public.imagenes (categoria_id);

create index if not exists imagenes_hashtags_idx
  on public.imagenes using gin (hashtags);

-- ─────────────────────────────────────────────────────────────────
-- Audio / reverse journaling
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.audios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  titulo text,
  archivo_path text not null,
  duracion_segundos integer,
  transcripcion text,
  fecha timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists audios_usuario_fecha_idx
  on public.audios (usuario_id, fecha desc);

create index if not exists audios_categoria_idx on public.audios (categoria_id);

-- ─────────────────────────────────────────────────────────────────
-- Temas visuales (personalización)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.temas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null default 'Mi tema',
  colores jsonb not null default '{}'::jsonb,
  cursor text,
  iconos jsonb not null default '{}'::jsonb,
  tipografia text,
  created_at timestamptz not null default now()
);

alter table public.perfiles
  drop constraint if exists perfiles_tema_activo_fk;
alter table public.perfiles
  add constraint perfiles_tema_activo_fk
  foreign key (tema_activo_id) references public.temas (id) on delete set null;

-- ─────────────────────────────────────────────────────────────────
-- Row Level Security: cada usuario solo ve y modifica lo suyo
-- ─────────────────────────────────────────────────────────────────
alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.entradas enable row level security;
alter table public.listas enable row level security;
alter table public.items_lista enable row level security;
alter table public.imagenes enable row level security;
alter table public.audios enable row level security;
alter table public.temas enable row level security;

drop policy if exists "perfiles: dueño" on public.perfiles;
create policy "perfiles: dueño" on public.perfiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "categorias: dueño" on public.categorias;
create policy "categorias: dueño" on public.categorias
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists "entradas: dueño" on public.entradas;
create policy "entradas: dueño" on public.entradas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists "listas: dueño" on public.listas;
create policy "listas: dueño" on public.listas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists "items_lista: dueño" on public.items_lista;
create policy "items_lista: dueño" on public.items_lista
  for all using (
    exists (
      select 1 from public.listas
      where listas.id = items_lista.lista_id
        and listas.usuario_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listas
      where listas.id = items_lista.lista_id
        and listas.usuario_id = auth.uid()
    )
  );

drop policy if exists "imagenes: dueño" on public.imagenes;
create policy "imagenes: dueño" on public.imagenes
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists "audios: dueño" on public.audios;
create policy "audios: dueño" on public.audios
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists "temas: dueño" on public.temas;
create policy "temas: dueño" on public.temas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- Crear el perfil automáticamente cuando se registra un usuario
-- ─────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, new.raw_user_meta_data ->> 'nombre');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
-- Storage: buckets de fotos y audio
--
-- Privados por defecto: se sirven con URLs firmadas, filtrando siempre
-- por carpeta `usuario_id/...` dentro del bucket. Restringidos a
-- usuarios autenticados.
-- ─────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('imagenes', 'imagenes', false),
  ('audios', 'audios', false)
on conflict (id) do nothing;

drop policy if exists "imagenes: dueño lee sus archivos" on storage.objects;
create policy "imagenes: dueño lee sus archivos" on storage.objects
  for select to authenticated using (
    bucket_id = 'imagenes' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "imagenes: dueño sube sus archivos" on storage.objects;
create policy "imagenes: dueño sube sus archivos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'imagenes' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "imagenes: dueño borra sus archivos" on storage.objects;
create policy "imagenes: dueño borra sus archivos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'imagenes' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "audios: dueño lee sus archivos" on storage.objects;
create policy "audios: dueño lee sus archivos" on storage.objects
  for select to authenticated using (
    bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "audios: dueño sube sus archivos" on storage.objects;
create policy "audios: dueño sube sus archivos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "audios: dueño borra sus archivos" on storage.objects;
create policy "audios: dueño borra sus archivos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text
  );
