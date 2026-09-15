-- Hajj Terminal uses small sandwiches and club sandwiches, not the four large sandwiches.
update public.hajj_products
set active = false
where code in ('fajita','tuna','halloumi','turkey');
