-- Cuarto Propio — código corto para las URLs de entradas del diario.
--
-- El id sigue siendo la UUID real (clave primaria, usada en RLS y en el
-- resto del esquema); `codigo` es solo para que la URL sea corta y opaca
-- (/diario/x7k2m9pl en vez de /diario/a1f20340-a264-41c8-...).
-- 8 caracteres hex tomados de una UUID random: ~4300 millones de
-- combinaciones, de sobra para el volumen de un diario personal.

alter table public.entradas
  add column if not exists codigo text
  not null
  default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

create unique index if not exists entradas_codigo_idx on public.entradas (codigo);
