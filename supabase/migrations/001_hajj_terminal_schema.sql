create extension if not exists pgcrypto;

create table if not exists public.hajj_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hajj_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null check (category in ('Sandwiches','Cakes','Croissants')),
  shelf_life_days integer not null default 5,
  safety_stock integer not null default 0,
  target_days numeric(5,2) not null default 1.5,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hajj_inventory_counts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  location_id uuid not null references public.hajj_locations(id),
  counted_at timestamptz not null,
  reported_by text,
  status text not null default 'submitted' check(status in ('draft','submitted','approved')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.hajj_inventory_count_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  count_id uuid not null references public.hajj_inventory_counts(id) on delete cascade,
  product_id uuid not null references public.hajj_products(id),
  quantity integer not null check(quantity >= 0),
  unique(count_id, product_id)
);

create table if not exists public.hajj_receivings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  location_id uuid not null references public.hajj_locations(id),
  received_at timestamptz not null,
  supplier text,
  reference text,
  status text not null default 'received',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.hajj_receiving_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  receiving_id uuid not null references public.hajj_receivings(id) on delete cascade,
  product_id uuid not null references public.hajj_products(id),
  quantity integer not null check(quantity >= 0)
);

create table if not exists public.hajj_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_location_id uuid references public.hajj_locations(id),
  destination_location_id uuid references public.hajj_locations(id),
  source_label text,
  destination_label text,
  transferred_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.hajj_transfer_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  transfer_id uuid not null references public.hajj_transfers(id) on delete cascade,
  product_id uuid not null references public.hajj_products(id),
  quantity integer not null check(quantity >= 0)
);

create table if not exists public.hajj_waste (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  location_id uuid not null references public.hajj_locations(id),
  occurred_at timestamptz not null,
  reason text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.hajj_waste_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  waste_id uuid not null references public.hajj_waste(id) on delete cascade,
  product_id uuid not null references public.hajj_products(id),
  quantity integer not null check(quantity >= 0)
);

create table if not exists public.hajj_stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  location_id uuid not null references public.hajj_locations(id),
  product_id uuid not null references public.hajj_products(id),
  quantity_delta integer not null,
  reason text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.hajj_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  location_id uuid not null references public.hajj_locations(id),
  order_for date not null,
  order_type text not null check(order_type in ('tomorrow','weekend','emergency')),
  status text not null default 'recommended' check(status in ('draft','recommended','approved','partially_received','received','cancelled')),
  approved_at timestamptz,
  explanation text,
  notes text,
  calendar_event_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.hajj_order_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  order_id uuid not null references public.hajj_orders(id) on delete cascade,
  product_id uuid not null references public.hajj_products(id),
  recommended_qty integer not null default 0,
  approved_qty integer,
  received_qty integer,
  forecast_qty numeric(10,2),
  confidence text check(confidence in ('High','Medium','Low'))
);

create table if not exists public.hajj_forecast_accuracy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  location_id uuid not null references public.hajj_locations(id),
  product_id uuid not null references public.hajj_products(id),
  forecast_date date not null,
  predicted_movement numeric(10,2) not null,
  actual_movement numeric(10,2),
  recommended_order_qty integer,
  approved_order_qty integer,
  actual_received_qty integer,
  forecast_error numeric(10,2),
  absolute_error numeric(10,2),
  percentage_error numeric(10,2),
  stockout_occurred boolean not null default false,
  overstock_occurred boolean not null default false,
  estimated_lost_sales numeric(10,2),
  confidence text check(confidence in ('High','Medium','Low')),
  reconciled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, location_id, product_id, forecast_date)
);

create table if not exists public.hajj_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

insert into public.hajj_locations(name) values ('Hajj Terminal') on conflict(name) do nothing;
insert into public.hajj_products(code,name,category,shelf_life_days,safety_stock,target_days) values
('fajita','Chicken Fajita','Sandwiches',5,18,1.5),
('tuna','Tuna','Sandwiches',5,6,1.5),
('halloumi','Halloumi','Sandwiches',5,6,1.5),
('turkey','Turkey & Cheese','Sandwiches',5,6,1.5),
('ranch','Chicken Ranch Club','Sandwiches',5,5,1.5),
('caesar','Chicken Caesar Club','Sandwiches',5,5,1.5),
('three_cheese','3 Cheese Club','Sandwiches',5,5,1.5),
('lemon','Lemon English Cake','Cakes',14,4,2),
('date','Date English Cake','Cakes',14,4,2),
('croissant_yellow','Croissant Yellow Cheese','Croissants',4,3,1.5),
('croissant_white','Croissant White Cheese','Croissants',4,3,1.5),
('croissant_chocolate','Croissant Chocolate','Croissants',4,3,1.5),
('croissant_plain','Croissant Plain','Croissants',4,3,1.5)
on conflict(code) do nothing;

alter table public.hajj_locations enable row level security;
alter table public.hajj_products enable row level security;
alter table public.hajj_inventory_counts enable row level security;
alter table public.hajj_inventory_count_items enable row level security;
alter table public.hajj_receivings enable row level security;
alter table public.hajj_receiving_items enable row level security;
alter table public.hajj_transfers enable row level security;
alter table public.hajj_transfer_items enable row level security;
alter table public.hajj_waste enable row level security;
alter table public.hajj_waste_items enable row level security;
alter table public.hajj_stock_adjustments enable row level security;
alter table public.hajj_orders enable row level security;
alter table public.hajj_order_items enable row level security;
alter table public.hajj_forecast_accuracy enable row level security;
alter table public.hajj_audit_logs enable row level security;

create policy hajj_locations_authenticated_read on public.hajj_locations for select to authenticated using (true);
create policy hajj_products_authenticated_read on public.hajj_products for select to authenticated using (true);

create policy hajj_inventory_counts_own_all on public.hajj_inventory_counts for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_inventory_count_items_own_all on public.hajj_inventory_count_items for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_receivings_own_all on public.hajj_receivings for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_receiving_items_own_all on public.hajj_receiving_items for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_transfers_own_all on public.hajj_transfers for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_transfer_items_own_all on public.hajj_transfer_items for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_waste_own_all on public.hajj_waste for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_waste_items_own_all on public.hajj_waste_items for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_stock_adjustments_own_all on public.hajj_stock_adjustments for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_orders_own_all on public.hajj_orders for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_order_items_own_all on public.hajj_order_items for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_forecast_accuracy_own_all on public.hajj_forecast_accuracy for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_audit_logs_own_all on public.hajj_audit_logs for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create or replace view public.hajj_event_ledger with (security_invoker=true) as
select r.user_id,r.location_id,ri.product_id,ri.quantity as quantity_delta,'receiving'::text as event_type,r.received_at as occurred_at,r.id as reference_id,coalesce(r.supplier,r.reference,'Receiving') as label
from public.hajj_receivings r join public.hajj_receiving_items ri on ri.receiving_id=r.id where r.status='received'
union all
select t.user_id,t.destination_location_id,ti.product_id,ti.quantity,'transfer_in',t.transferred_at,t.id,coalesce(t.source_label,'Transfer in')
from public.hajj_transfers t join public.hajj_transfer_items ti on ti.transfer_id=t.id where t.destination_location_id is not null
union all
select t.user_id,t.source_location_id,ti.product_id,-ti.quantity,'transfer_out',t.transferred_at,t.id,coalesce(t.destination_label,'Transfer out')
from public.hajj_transfers t join public.hajj_transfer_items ti on ti.transfer_id=t.id where t.source_location_id is not null
union all
select w.user_id,w.location_id,wi.product_id,-wi.quantity,'waste',w.occurred_at,w.id,coalesce(w.reason,'Waste')
from public.hajj_waste w join public.hajj_waste_items wi on wi.waste_id=w.id
union all
select a.user_id,a.location_id,a.product_id,a.quantity_delta,'adjustment',a.occurred_at,a.id,a.reason
from public.hajj_stock_adjustments a;

create index if not exists hajj_counts_user_counted_at_idx on public.hajj_inventory_counts(user_id,counted_at desc);
create index if not exists hajj_receivings_user_received_at_idx on public.hajj_receivings(user_id,received_at desc);
create index if not exists hajj_transfers_user_transferred_at_idx on public.hajj_transfers(user_id,transferred_at desc);
create index if not exists hajj_orders_user_order_for_idx on public.hajj_orders(user_id,order_for desc);
create index if not exists hajj_forecast_user_date_idx on public.hajj_forecast_accuracy(user_id,forecast_date desc);
