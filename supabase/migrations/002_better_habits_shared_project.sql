
-- Hajj Terminal tables are namespaced so an existing Supabase project is safe.
-- The reference catalog is shared; every operational row belongs to auth.uid().

create table if not exists public.hajj_locations (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.hajj_products (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
  category text not null check (category in ('Sandwiches','Cakes','Croissants')),
  shelf_life_days integer not null default 5, safety_stock integer not null default 0,
  target_days numeric(5,2) not null default 1.5, active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.hajj_inventory_counts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  location_id uuid not null references public.hajj_locations(id), counted_at timestamptz not null,
  reported_by text, status text not null default 'submitted', notes text, created_at timestamptz not null default now()
);
create table if not exists public.hajj_inventory_count_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  count_id uuid not null references public.hajj_inventory_counts(id) on delete cascade,
  product_id uuid not null references public.hajj_products(id), quantity integer not null check(quantity >= 0), unique(count_id,product_id)
);
create table if not exists public.hajj_receivings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  location_id uuid not null references public.hajj_locations(id), received_at timestamptz not null,
  supplier text, reference text, status text not null default 'received', notes text, created_at timestamptz not null default now()
);
create table if not exists public.hajj_receiving_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  receiving_id uuid not null references public.hajj_receivings(id) on delete cascade,
  product_id uuid not null references public.hajj_products(id), quantity integer not null check(quantity >= 0)
);
create table if not exists public.hajj_transfers (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  source_location_id uuid references public.hajj_locations(id), destination_location_id uuid references public.hajj_locations(id),
  transferred_at timestamptz not null, notes text, created_at timestamptz not null default now()
);
create table if not exists public.hajj_transfer_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  transfer_id uuid not null references public.hajj_transfers(id) on delete cascade,
  product_id uuid not null references public.hajj_products(id), quantity integer not null check(quantity >= 0)
);
create table if not exists public.hajj_waste (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  location_id uuid not null references public.hajj_locations(id), occurred_at timestamptz not null,
  reason text, notes text, created_at timestamptz not null default now()
);
create table if not exists public.hajj_waste_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  waste_id uuid not null references public.hajj_waste(id) on delete cascade,
  product_id uuid not null references public.hajj_products(id), quantity integer not null check(quantity >= 0)
);
create table if not exists public.hajj_stock_adjustments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  location_id uuid not null references public.hajj_locations(id), product_id uuid not null references public.hajj_products(id),
  quantity_delta integer not null, reason text not null, occurred_at timestamptz not null, created_at timestamptz not null default now()
);
create table if not exists public.hajj_orders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  location_id uuid not null references public.hajj_locations(id), order_for date not null,
  order_type text not null check(order_type in ('tomorrow','weekend','emergency')),
  status text not null default 'recommended', explanation text, created_at timestamptz not null default now()
);
create table if not exists public.hajj_order_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  order_id uuid not null references public.hajj_orders(id) on delete cascade,
  product_id uuid not null references public.hajj_products(id), recommended_qty integer not null default 0,
  approved_qty integer, received_qty integer, forecast_qty numeric(10,2), confidence text check(confidence in ('High','Medium','Low'))
);
create table if not exists public.hajj_forecast_accuracy (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  location_id uuid not null references public.hajj_locations(id), product_id uuid not null references public.hajj_products(id),
  forecast_date date not null, predicted_movement numeric(10,2) not null, actual_movement numeric(10,2),
  recommended_order_qty integer, approved_order_qty integer, actual_received_qty integer,
  forecast_error numeric(10,2), absolute_error numeric(10,2), percentage_error numeric(10,2),
  stockout_occurred boolean default false, overstock_occurred boolean default false,
  created_at timestamptz not null default now(), unique(user_id,location_id,product_id,forecast_date)
);
create table if not exists public.hajj_audit_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
  entity_type text not null, entity_id uuid, action text not null, old_value jsonb, new_value jsonb,
  reason text, actor text, created_at timestamptz not null default now()
);

insert into public.hajj_locations(name) values ('Hajj Terminal') on conflict(name) do nothing;
insert into public.hajj_products(code,name,category,shelf_life_days,safety_stock,target_days) values
('fajita','Chicken Fajita','Sandwiches',5,18,1.5),('tuna','Tuna','Sandwiches',5,6,1.5),
('halloumi','Halloumi','Sandwiches',5,6,1.5),('turkey','Turkey & Cheese','Sandwiches',5,6,1.5),
('ranch','Chicken Ranch Club','Sandwiches',5,5,1.5),('caesar','Chicken Caesar Club','Sandwiches',5,5,1.5),
('three_cheese','3 Cheese Club','Sandwiches',5,5,1.5),('lemon','Lemon English Cake','Cakes',14,4,2),
('date','Date English Cake','Cakes',14,4,2),('croissant_yellow','Croissant Yellow Cheese','Croissants',4,3,1.5),
('croissant_white','Croissant White Cheese','Croissants',4,3,1.5),('croissant_chocolate','Croissant Chocolate','Croissants',4,3,1.5),
('croissant_plain','Croissant Plain','Croissants',4,3,1.5)
on conflict(code) do update set name=excluded.name, category=excluded.category, shelf_life_days=excluded.shelf_life_days,
safety_stock=excluded.safety_stock, target_days=excluded.target_days, active=true;

do $$ declare t text; begin
  foreach t in array array['hajj_locations','hajj_products','hajj_inventory_counts','hajj_inventory_count_items','hajj_receivings',
    'hajj_receiving_items','hajj_transfers','hajj_transfer_items','hajj_waste','hajj_waste_items','hajj_stock_adjustments',
    'hajj_orders','hajj_order_items','hajj_forecast_accuracy','hajj_audit_logs']
  loop execute format('alter table public.%I enable row level security',t); end loop;
end $$;

drop policy if exists hajj_reference_read on public.hajj_locations;
create policy hajj_reference_read on public.hajj_locations for select to authenticated using (true);
drop policy if exists hajj_product_read on public.hajj_products;
create policy hajj_product_read on public.hajj_products for select to authenticated using (true);
do $$ declare t text; begin
  foreach t in array array['hajj_inventory_counts','hajj_inventory_count_items','hajj_receivings','hajj_receiving_items','hajj_transfers',
    'hajj_transfer_items','hajj_waste','hajj_waste_items','hajj_stock_adjustments','hajj_orders','hajj_order_items','hajj_forecast_accuracy','hajj_audit_logs']
  loop
    execute format('drop policy if exists hajj_owner_select on public.%I',t);
    execute format('drop policy if exists hajj_owner_insert on public.%I',t);
    execute format('drop policy if exists hajj_owner_update on public.%I',t);
    execute format('drop policy if exists hajj_owner_delete on public.%I',t);
    execute format('create policy hajj_owner_select on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
    execute format('create policy hajj_owner_insert on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
    execute format('create policy hajj_owner_update on public.%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
    execute format('create policy hajj_owner_delete on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t);
  end loop;
end $$;

grant select on public.hajj_locations,public.hajj_products to authenticated;
grant select,insert,update,delete on public.hajj_inventory_counts,public.hajj_inventory_count_items,public.hajj_receivings,
public.hajj_receiving_items,public.hajj_transfers,public.hajj_transfer_items,public.hajj_waste,public.hajj_waste_items,
public.hajj_stock_adjustments,public.hajj_orders,public.hajj_order_items,public.hajj_forecast_accuracy,public.hajj_audit_logs to authenticated;

create or replace view public.hajj_event_ledger with (security_invoker=true) as
select r.user_id,r.location_id,ri.product_id,ri.quantity::integer as quantity_delta,'receiving'::text as event_type,
r.received_at as occurred_at,coalesce(r.supplier,r.reference) as label from public.hajj_receivings r join public.hajj_receiving_items ri on ri.receiving_id=r.id
union all select t.user_id,coalesce(t.destination_location_id,t.source_location_id),ti.product_id,
case when t.destination_location_id is not null then ti.quantity else -ti.quantity end,
('transfer_'||case when t.destination_location_id is not null then 'in' else 'out' end)::text,t.transferred_at,t.notes
from public.hajj_transfers t join public.hajj_transfer_items ti on ti.transfer_id=t.id
union all select w.user_id,w.location_id,wi.product_id,-wi.quantity,'waste',w.occurred_at,w.reason
from public.hajj_waste w join public.hajj_waste_items wi on wi.waste_id=w.id
union all select a.user_id,a.location_id,a.product_id,a.quantity_delta,'adjustment',a.occurred_at,a.reason from public.hajj_stock_adjustments a;
grant select on public.hajj_event_ledger to authenticated;
