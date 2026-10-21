-- Cuarto Propio — la casilla de un ítem de lista pasa a ser opcional.
--
-- Un ítem puede ser una línea de texto libre (estilo app de notas) o una
-- tarea con casilla. `marcado` solo tiene sentido cuando `con_casilla` es
-- true. Los ítems que ya existían eran todos checklist, así que se
-- conservan con casilla; los nuevos nacen como texto libre.

alter table public.items_lista
  add column if not exists con_casilla boolean not null default true;

alter table public.items_lista
  alter column con_casilla set default false;
