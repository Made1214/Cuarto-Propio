-- Ajustes de seguridad que pidió el revisor de Supabase (Database Advisors)
-- después de aplicar 0009 y 0010.
--
-- En Supabase, las funciones nuevas de `public` reciben EXECUTE para `anon` y
-- `authenticated` directamente (no a través de `public`), así que el
-- `revoke ... from public` de las migraciones anteriores no alcanzaba.
--
-- Quedan abiertas a `anon` A PROPÓSITO solo las dos del login, que corren
-- antes de que haya sesión: `login_bloqueado_hasta` y `registrar_fallo_login`.

-- Solo con sesión.
revoke execute on function public.limpiar_intentos_login() from anon;
revoke execute on function public.uso_storage() from anon;

-- Función de trigger (crea el perfil al registrarse): nadie tiene que
-- llamarla por la API. El trigger sigue funcionando igual: el permiso se
-- revisa al crear el trigger, no cada vez que se dispara.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- search_path fijo, para que nadie pueda colar otra función con el mismo
-- nombre en un schema que se busque antes.
alter function public.set_updated_at() set search_path = public;
