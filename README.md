# Hajj Terminal Inventory

Cloud inventory, movement, order forecasting and audit workflow for Hajj Terminal.

## Features
- Daily physical stock counts
- Receiving, transfer in/out, waste and signed adjustments
- Exact event-ledger movement between physical counts
- 3/7/14-day movement analysis and days-of-stock
- Discrepancy and possible-stockout detection
- Tomorrow, emergency, and Thursday + Friday weekend ordering
- Manager approval overrides saved beside system recommendations
- Forecast accuracy reconciliation and censored-demand handling
- CSV, Excel, PDF and JSON exports
- Optional read-only inventory AI assistant
- PWA/offline fallback

## Production configuration
Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY` (optional)
- `OPENAI_MODEL` (optional)

Do not commit secret keys. The Supabase publishable key is intended for client use, but production data remains protected by Row Level Security.

## Data privacy
Source control contains only synthetic demo counts. Real operational counts, receiving, transfers, waste, orders and forecast history live in Supabase.

## Run
```bash
npm install
npm run test
npm run build
npm run dev
```

## Safety model
AI is read-only. Inventory writes and order approvals remain explicit user actions and are auditable.
