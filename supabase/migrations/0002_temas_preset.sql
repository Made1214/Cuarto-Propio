-- Cuarto Propio — base para el sistema de temas de diseño (retro, fairy, emo, ...).
--
-- `preset` identifica qué tema con nombre (ver src/lib/temas/presets.ts) usa
-- esta fila como punto de partida. NULL significa un tema totalmente
-- personalizado, armado a mano desde Personalización, sin partir de ningún
-- preset con nombre.

alter table public.temas
  add column if not exists preset text;
