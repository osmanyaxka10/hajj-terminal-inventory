-- Applied live to Better Habits Supabase project; hajj_* only.
alter table public.hajj_forecast_accuracy
  add column if not exists estimated_lost_sales numeric(10,2),
  add column if not exists confidence text check (confidence in ('High','Medium','Low')),
  add column if not exists reconciled_at timestamptz,
  add column if not exists notes text;

create index if not exists hajj_forecast_reconcile_idx
  on public.hajj_forecast_accuracy(user_id, forecast_date, reconciled_at);