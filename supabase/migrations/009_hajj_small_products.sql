-- Small sandwiches and Devon small croissants are also stocked at Hajj Terminal.
update public.hajj_products
set active = code in (
  'fajita','tuna','halloumi','turkey','ranch','caesar','three_cheese',
  'fajita_small','turkey_small','tuna_small','halloumi_small',
  'lemon','date',
  'croissant_yellow','croissant_white','croissant_chocolate','croissant_plain',
  'croissant_small_butter','croissant_small_white','croissant_small_yellow','croissant_small_chocolate'
);

update public.hajj_products set name='Devon Small Butter Croissant', shelf_life_days=4 where code='croissant_small_butter';
update public.hajj_products set name='Devon Small White Cheese Croissant', shelf_life_days=4 where code='croissant_small_white';
update public.hajj_products set name='Devon Small Yellow Cheese Croissant', shelf_life_days=4 where code='croissant_small_yellow';
update public.hajj_products set name='Devon Small Chocolate Croissant', shelf_life_days=4 where code='croissant_small_chocolate';
update public.hajj_products set shelf_life_days=5 where code in ('fajita_small','turkey_small','tuna_small','halloumi_small');
