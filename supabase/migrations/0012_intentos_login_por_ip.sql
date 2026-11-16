-- Bloqueo de login por correo E IP, no solo por correo.
--
-- El problema con 0009: el contador era por correo y `registrar_fallo_login`
-- se puede llamar sin sesión (tiene que poder: los fallos pasan antes de
-- entrar). Así que cualquiera que supiera el correo de una usuaria podía
-- llamar a `/rest/v1/rpc/registrar_fallo_login` cinco veces con la clave
-- pública y dejarla fuera de su cuenta, y repetirlo cada 15 minutos.
--
-- Ahora el contador es por par (correo, IP): los fallos de quien ataca desde
-- su IP bloquean solo esa IP para ese correo, y la dueña sigue entrando desde
-- la suya. La IP la lee el servidor de Next de los encabezados de la petición
-- (src/lib/auth/ip.ts) y la pasa a las funciones.
--
-- LÍMITE HONESTO de esta solución: las funciones siguen siendo llamables sin
-- sesión y la IP la manda quien llama, así que alguien que conozca el correo
-- Y la IP de la víctima todavía podría bloquearla (es mucho más difícil, pero
-- no imposible). Y al revés: quien rote de IP no acumula el bloqueo — contra
-- eso quedan los límites por IP que ya trae Supabase Auth. La solución
-- completa es registrar los fallos desde el servidor con la clave secreta de
-- Supabase y quitarle a `anon` el permiso de ejecutar estas funciones; queda
-- para cuando la app tenga esa variable de entorno configurada.

-- Los intentos guardados son efímeros (duran 15 minutos): se empieza de cero
-- en vez de inventarles una IP.
delete from public.intentos_login;

alter table public.intentos_login
  add column ip text not null default 'desconocida';

alter table public.intentos_login drop constraint intentos_login_pkey;
alter table public.intentos_login add primary key (email, ip);

-- Ahora cualquiera puede crear filas: topes de largo para que nadie meta
-- valores enormes (las funciones ya normalizan, esto es la red de abajo).
alter table public.intentos_login
  add constraint intentos_login_email_largo check (char_length(email) <= 320),
  add constraint intentos_login_ip_largo check (char_length(ip) <= 45);

-- Para la limpieza de filas viejas en `registrar_fallo_login`.
create index if not exists intentos_login_actualizado_en_idx
  on public.intentos_login (actualizado_en);

comment on table public.intentos_login is
  'Fallos de login seguidos por correo e IP, para el bloqueo de 15 min tras 5 fallos. Solo vía funciones.';

-- Las firmas viejas, de un solo argumento, se borran: si quedaran, seguirían
-- sirviendo para bloquear por correo solo.
drop function if exists public.login_bloqueado_hasta(text);
drop function if exists public.registrar_fallo_login(text);

-- La IP en su forma canónica (`host()` de `inet`: sin máscara, IPv6 en
-- minúsculas y abreviada), o 'desconocida' si lo que llega no es una IP. Así
-- no se puede guardar texto arbitrario en la columna. Uso interno: no se
-- expone por la API.
create or replace function public.normalizar_ip_login(p_ip text)
returns text
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_ip is null or char_length(p_ip) > 64 then
    return 'desconocida';
  end if;
  return host(trim(p_ip)::inet);
exception when others then
  return 'desconocida';
end;
$$;

-- ¿Está bloqueado este correo desde esta IP? Devuelve hasta cuándo, o null.
create or replace function public.login_bloqueado_hasta(p_email text, p_ip text)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select bloqueado_hasta
  from intentos_login
  where email = lower(trim(p_email))
    and ip = normalizar_ip_login(p_ip)
    and bloqueado_hasta > now();
$$;

-- Anota un fallo para el par (correo, IP). Si con este van 5 seguidos,
-- bloquea 15 minutos y devuelve hasta cuándo; si no, null. Igual que en 0009,
-- un fallo de hace más de 15 minutos no se suma.
--
-- De paso borra las filas de más de un día: ahora cualquiera puede generar
-- filas (un correo y una IP cualquiera por llamada), y así la tabla no crece
-- sin fin. Un bloqueo dura 15 minutos, así que nada vigente se pierde.
create or replace function public.registrar_fallo_login(p_email text, p_ip text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_ip text := normalizar_ip_login(p_ip);
  v_fallidos integer;
  v_hasta timestamptz;
begin
  if v_email is null or v_email = '' or char_length(v_email) > 320 then
    return null;
  end if;

  delete from intentos_login where actualizado_en < now() - interval '1 day';

  insert into intentos_login as i (email, ip, fallidos, actualizado_en)
  values (v_email, v_ip, 1, now())
  on conflict (email, ip) do update set
    fallidos = case
      when i.actualizado_en < now() - interval '15 minutes'
        or (i.bloqueado_hasta is not null and i.bloqueado_hasta <= now())
      then 1
      else i.fallidos + 1
    end,
    bloqueado_hasta = case
      when i.bloqueado_hasta is not null and i.bloqueado_hasta <= now() then null
      else i.bloqueado_hasta
    end,
    actualizado_en = now()
  returning fallidos, bloqueado_hasta into v_fallidos, v_hasta;

  if v_fallidos >= 5 then
    update intentos_login
    set bloqueado_hasta = now() + interval '15 minutes', fallidos = 0
    where email = v_email and ip = v_ip
    returning bloqueado_hasta into v_hasta;
  end if;

  return v_hasta;
end;
$$;

-- Tras entrar bien: borra los intentos del correo de la sesión, desde todas
-- las IP (quien sabe la contraseña ya no necesita esos bloqueos). Misma
-- función que en 0009; se vuelve a declarar para dejarla junto a las otras.
create or replace function public.limpiar_intentos_login()
returns void
language sql
security definer
set search_path = public
as $$
  delete from intentos_login where email = lower(auth.jwt() ->> 'email');
$$;

-- Permisos. Como aprendió 0011: en Supabase las funciones nuevas de `public`
-- reciben EXECUTE para `anon` y `authenticated` directo, así que no alcanza
-- con revocar de `public`.
revoke all on function public.normalizar_ip_login(text) from public, anon, authenticated;
revoke all on function public.login_bloqueado_hasta(text, text) from public, anon, authenticated;
revoke all on function public.registrar_fallo_login(text, text) from public, anon, authenticated;
revoke all on function public.limpiar_intentos_login() from public, anon, authenticated;

-- Abiertas a `anon` a propósito: el login las llama antes de que haya sesión.
grant execute on function public.login_bloqueado_hasta(text, text) to anon, authenticated;
grant execute on function public.registrar_fallo_login(text, text) to anon, authenticated;
-- Solo con sesión.
grant execute on function public.limpiar_intentos_login() to authenticated;
