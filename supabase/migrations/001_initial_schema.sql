-- Hajj Terminal Inventory schema
create extension if not exists pgcrypto;

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
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

create table if not exists inventory_counts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id),
  counted_at timestamptz not null,
  reported_by text,
  status text not null default 'submitted' check(status in ('draft','submitted','approved')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists inventory_count_items (
  id uuid primary key default gen_random_uuid(),
  count_id uuid not null references inventory_counts(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check(quantity >= 0),
  unique(count_id, product_id)
);

create table if not exists receivings (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id),
  received_at timestamptz not null,
  supplier text,
  reference text,
  status text not null default 'received',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists receiving_items (
  id uuid primary key default gen_random_uuid(),
  receiving_id uuid not null references receivings(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check(quantity >= 0)
);

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  source_location_id uuid references locations(id),
  destination_location_id uuid references locations(id),
  transferred_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references transfers(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check(quantity >= 0)
);

create table if not exists waste (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id),
  occurred_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists waste_items (
  id uuid primary key default gen_random_uuid(),
  waste_id uuid not null references waste(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check(quantity >= 0)
);

create table if not exists stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id),
  product_id uuid not null references products(id),
  quantity_delta integer not null,
  reason text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id),
  order_for date not null,
  order_type text not null check(order_type in ('tomorrow','weekend','emergency')),
  status text not null default 'recommended' check(status in ('draft','recommended','approved','partially_received','received','cancelled')),
  explanation text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  recommended_qty integer not null default 0,
  approved_qty integer,
  received_qty integer,
  forecast_qty numeric(10,2),
  confidence text check(confidence in ('High','Medium','Low'))
);

create table if not exists forecast_accuracy (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id),
  product_id uuid not null references products(id),
  forecast_date date not null,
  predicted_movement numeric(10,2) not null,
  actual_movement numeric(10,2),
  recommended_order_qty integer,
  approved_order_qty integer,
  actual_received_qty integer,
  forecast_error numeric(10,2),
  absolute_error numeric(10,2),
  percentage_error numeric(10,2),
  stockout_occurred boolean default false,
  overstock_occurred boolean default false,
  created_at timestamptz not null default now(),
  unique(location_id,product_id,forecast_date)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  reason text,
  actor text,
  created_at timestamptz not null default now()
);

insert into locations(name) values ('Hajj Terminal') on conflict do nothing;

insert into products(code,name,category,shelf_life_days,safety_stock,target_days) values
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

alter table locations enable row level security;
alter table products enable row level security;
alter table inventory_counts enable row level security;
alter table inventory_count_items enable row level security;
alter table receivings enable row level security;
alter table receiving_items enable row level security;
alter table transfers enable row level security;
alter table transfer_items enable row level security;
alter table waste enable row level security;
alter table waste_items enable row level security;
alter table stock_adjustments enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table forecast_accuracy enable row level security;
alter table audit_logs enable row level security;