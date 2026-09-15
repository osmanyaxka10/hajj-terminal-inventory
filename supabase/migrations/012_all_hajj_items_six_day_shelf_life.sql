-- All active Hajj Terminal items use a six-day shelf life.
update public.hajj_products
set shelf_life_days = 6
where active = true;
