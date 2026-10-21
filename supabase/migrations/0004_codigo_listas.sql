-- Cuarto Propio — código corto para las URLs de listas (mismo patrón que
-- 0003_codigo_entradas.sql): el id sigue siendo la UUID real, `codigo` es
-- solo para que la URL sea corta y opaca (/listas/x7k2m9pl).

alter table public.listas
  add column if not exists codigo text
  not null
  default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

create unique index if not exists listas_codigo_idx on public.listas (codigo);
