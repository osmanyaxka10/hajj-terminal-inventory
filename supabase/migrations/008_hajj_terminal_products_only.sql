-- Keep historical catalogue rows for foreign-key integrity, but show only Hajj Terminal items.
update public.hajj_products
set active = code in (
  'fajita','tuna','halloumi','turkey','ranch','caesar','three_cheese',
  'lemon','date','croissant_yellow','croissant_white','croissant_chocolate','croissant_plain'
);

update public.hajj_products set name='Chicken Fajita Wrap' where code='fajita';
update public.hajj_products set name='Tuna Spicy Cheese Ciabatta' where code='tuna';
update public.hajj_products set name='Halloumi Pesto Baguette' where code='halloumi';
update public.hajj_products set name='Turkey & Cheese Baguette' where code='turkey';
