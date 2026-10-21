-- Cuarto Propio — código corto para las URLs de la Vitrina (mismo patrón que
-- 0003_codigo_entradas.sql y 0004_codigo_listas.sql): el id sigue siendo la
-- UUID real, `codigo` es solo para que la URL sea corta y opaca
-- (/vitrina/x7k2m9pl).

alter table public.imagenes
  add column if not exists codigo text
  not null
  default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

create unique index if not exists imagenes_codigo_idx on public.imagenes (codigo);
