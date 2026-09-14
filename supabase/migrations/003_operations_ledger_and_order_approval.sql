-- Applied live to the shared Better Habits Supabase project.
-- This migration only modifies hajj_* objects.
alter table public.hajj_transfers add column if not exists source_label text;
alter table public.hajj_transfers add column if not exists destination_label text;
alter table public.hajj_orders add column if not exists approved_at timestamptz;
alter table public.hajj_orders add column if not exists notes text;
alter table public.hajj_orders add column if not exists calendar_event_id text;

-- Exact event ledger combines receiving, transfer in/out, waste and adjustments.
-- Live database uses security_invoker=true so existing RLS stays effective.