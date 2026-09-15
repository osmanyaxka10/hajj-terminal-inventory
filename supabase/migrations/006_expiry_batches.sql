create table if not exists public.hajj_batches (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
 product_code text not null references public.hajj_products(code), quantity_received integer not null check(quantity_received>0),
 quantity_remaining integer not null check(quantity_remaining>=0 and quantity_remaining<=quantity_received),
 received_date date not null, expiry_date date not null check(expiry_date>=received_date), notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.hajj_batches enable row level security;
create policy hajj_batches_select on public.hajj_batches for select to authenticated using ((select auth.uid())=user_id);
create policy hajj_batches_insert on public.hajj_batches for insert to authenticated with check ((select auth.uid())=user_id);
create policy hajj_batches_update on public.hajj_batches for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy hajj_batches_delete on public.hajj_batches for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.hajj_batches to authenticated;
create index hajj_batches_user_expiry_idx on public.hajj_batches(user_id,expiry_date) where quantity_remaining>0;
