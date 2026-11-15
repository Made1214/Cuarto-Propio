-- Rate limiting de login (CLAUDE.md → Seguridad / Supuestos: bloqueo de 15
-- minutos tras 5 intentos fallidos seguidos).
--
-- Supabase Auth ya limita por IP, pero no "5 fallos seguidos sobre la misma
-- cuenta". Esta tabla lleva esa cuenta. Nadie la lee ni la escribe directo:
-- RLS activo y sin políticas; solo se toca a través de las funciones de
-- abajo, que corren como su dueño (`security definer`).
--
-- El contador es por correo (en minúsculas), no por IP: lo que se protege es
-- la cuenta. La contracara conocida de cualquier bloqueo por cuenta: alguien
-- que sepa el correo puede bloquearla 15 minutos a propósito. Para una app
-- personal es un precio razonable.

create table if not exists public.intentos_login (
  email text primary key,
  fallidos integer not null default 0,
  bloqueado_hasta timestamptz,
  actualizado_en timestamptz not null default now()
);

alter table public.intentos_login enable row level security;

comment on table public.intentos_login is
  'Fallos de login seguidos por correo, para el bloqueo de 15 min tras 5 fallos. Solo vía funciones.';

-- ¿Está bloqueada esta cuenta? Devuelve hasta cuándo, o null.
create or replace function public.login_bloqueado_hasta(p_email text)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select bloqueado_hasta
  from intentos_login
  where email = lower(trim(p_email))
    and bloqueado_hasta > now();
$$;

-- Anota un fallo. Si con este van 5 seguidos, bloquea 15 minutos y devuelve
-- hasta cuándo; si no, null. Un fallo viejo (más de 15 min) no se suma: la
-- cuenta vuelve a empezar, porque ya no son intentos "seguidos".
create or replace function public.registrar_fallo_login(p_email text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_fallidos integer;
  v_hasta timestamptz;
begin
  insert into intentos_login as i (email, fallidos, actualizado_en)
  values (v_email, 1, now())
  on conflict (email) do update set
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
    where email = v_email
    returning bloqueado_hasta into v_hasta;
  end if;

  return v_hasta;
end;
$$;

-- Tras entrar bien, la cuenta de fallos vuelve a cero. Solo con sesión, y
-- solo sobre el correo propio: así nadie puede "limpiar" el bloqueo de otra
-- cuenta sin saber su contraseña.
create or replace function public.limpiar_intentos_login()
returns void
language sql
security definer
set search_path = public
as $$
  delete from intentos_login where email = lower(auth.jwt() ->> 'email');
$$;

revoke all on function public.login_bloqueado_hasta(text) from public;
revoke all on function public.registrar_fallo_login(text) from public;
revoke all on function public.limpiar_intentos_login() from public;
grant execute on function public.login_bloqueado_hasta(text) to anon, authenticated;
grant execute on function public.registrar_fallo_login(text) to anon, authenticated;
grant execute on function public.limpiar_intentos_login() to authenticated;
