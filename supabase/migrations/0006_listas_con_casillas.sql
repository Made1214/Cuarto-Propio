-- Cuarto Propio — la casilla deja de ser por ítem y pasa a ser de la lista.
--
-- Antes cada ítem decidía si tenía casilla, lo que llenaba cada fila de
-- botones. Ahora la lista entera es "de notas" o "de casillas": se elige al
-- crearla y se puede cambiar después. `marcado` sigue viviendo en el ítem.

alter table public.listas
  add column if not exists con_casillas boolean not null default false;

-- Una lista que ya tenía algún ítem con casilla nace como lista de casillas.
update public.listas l
set con_casillas = true
where exists (
  select 1 from public.items_lista i
  where i.lista_id = l.id and i.con_casilla
);

alter table public.items_lista drop column if exists con_casilla;
