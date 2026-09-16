-- Cuarto Propio — esquema inicial (Fase 1)
--
-- Toda tabla de contenido lleva `usuario_id` y las políticas de RLS
-- siempre filtran por ese campo. Hoy solo existe un usuario real, pero
-- esto es justo lo que permite pasar a multiusuario más adelante sin
-- tocar la estructura de datos (ver Fase 2 en CLAUDE.md).

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
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.entradas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  titulo text,
  contenido jsonb not null default '{}'::jsonb,
  fecha timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entradas_usuario_fecha_idx
  on public.entradas (usuario_id, fecha desc);

-- ─────────────────────────────────────────────────────────────────
-- Listas y sus ítems (checklist simple: texto + marcado)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.listas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

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

create index if not exists imagenes_hashtags_idx
  on public.imagenes using gin (hashtags);

-- ─────────────────────────────────────────────────────────────────
-- Audio / reverse journaling
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.audios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  archivo_path text not null,
  duracion_segundos integer,
  transcripcion text,
  fecha timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists audios_usuario_fecha_idx
  on public.audios (usuario_id, fecha desc);

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

create policy "perfiles: dueño" on public.perfiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "categorias: dueño" on public.categorias
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy "entradas: dueño" on public.entradas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy "listas: dueño" on public.listas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

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

create policy "imagenes: dueño" on public.imagenes
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy "audios: dueño" on public.audios
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

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
