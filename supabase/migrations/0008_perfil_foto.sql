-- Foto de perfil: guardar las DOS versiones que devuelve el pipeline
--
-- `perfiles.foto_perfil_path` ya existía, pero una sola columna no alcanza:
-- el pipeline único de imágenes (CLAUDE.md → Procesamiento de imágenes)
-- siempre produce miniatura + versión completa, y guardar solo una dejaría
-- la otra huérfana en Storage, imposible de borrar después.
--
-- `foto_perfil_path` pasa a ser explícitamente la miniatura (la que se ve en
-- el avatar del navbar); la completa queda para un recorte o una vista
-- grande más adelante.
alter table public.perfiles
  add column if not exists foto_perfil_completa_path text;

comment on column public.perfiles.foto_perfil_path is
  'Miniatura de la foto de perfil (bucket `imagenes`, carpeta usuario_id/perfil).';
comment on column public.perfiles.foto_perfil_completa_path is
  'Versión completa de la foto de perfil, del mismo pipeline que la Vitrina.';
