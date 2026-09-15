-- Hajj Terminal uses the four small croissants only; use bakery-data product names.
update public.hajj_products
set active = false
where code in ('croissant_yellow','croissant_white','croissant_chocolate','croissant_plain');

update public.hajj_products set name='Chicken Ranch Club Sandwich' where code='ranch';
update public.hajj_products set name='Caesar Chicken Club Sandwich' where code='caesar';
update public.hajj_products set name='3 Cheese Club Sandwich' where code='three_cheese';
update public.hajj_products set name='English Lemon Cake' where code='lemon';
update public.hajj_products set name='English Dates Cake' where code='date';
update public.hajj_products set name='Croissant Small Butter' where code='croissant_small_butter';
update public.hajj_products set name='Croissant Small White Cheese' where code='croissant_small_white';
update public.hajj_products set name='Croissant Small Yellow Cheese' where code='croissant_small_yellow';
update public.hajj_products set name='Croissant Small Chocolate' where code='croissant_small_chocolate';
