-- Add the seven-day ordering workflow. Historical order types remain valid.
alter table public.hajj_orders
  drop constraint if exists hajj_orders_order_type_check;

alter table public.hajj_orders
  add constraint hajj_orders_order_type_check
  check (order_type in ('tomorrow','weekly','weekend','emergency'));

create index if not exists hajj_counts_user_location_time_idx
  on public.hajj_inventory_counts(user_id, location_id, counted_at desc);

create index if not exists hajj_receivings_user_location_time_idx
  on public.hajj_receivings(user_id, location_id, received_at desc);
