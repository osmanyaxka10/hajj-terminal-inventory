# Hajj Terminal Inventory V7

V7 completes the local and cloud workflows, reporting, calendar handoff and optional read-only AI assistant.

## V7 completion fixes
- Full offline/local daily counts, receiving, transfers, waste, adjustments and order approvals
- Prevents accidental all-zero daily counts
- Prevents transfer-out or waste quantities above current stock
- Uses the phone's local date instead of UTC
- Learns Thursday and Friday weekend demand as two separate forecasts
- Refreshes manager approval quantities whenever stock operations change recommendations
- Complete reproducible `hajj_*` Supabase schema with RLS and `security_invoker` ledger view
- Installable PWA icon and refreshed offline cache

## V6 additions
- OpenAI Responses API server route
- Uses GPT-5.6 Luna by default for cost-sensitive inventory Q&A
- AI receives a restricted inventory snapshot only
- AI cannot directly modify Supabase
- Excel `.xlsx` export
- PDF report export
- CSV exports retained
- Full JSON backup
- Google Calendar draft button
- Google Calendar-compatible `.ics` reminder
- Exact movement, forecast accuracy and manager override learning retained

## AI security model
The OpenAI API key is server-side only in `OPENAI_API_KEY`.
The browser never receives the key.

The assistant is deliberately read-only:
- no receiving writes
- no transfer writes
- no stock adjustments
- no order approvals
- no deletion
- no unrestricted database access

The core application works normally if no API key is configured.

## Calendar workflow
The app can open a pre-filled Google Calendar event in the user's browser.
The user reviews it before pressing Save in Google Calendar.
This avoids silently creating unwanted calendar events.

Current draft time is 09:00-09:30 Asia/Riyadh.
Change this in `lib/calendar.ts` when the preferred operational reminder time is confirmed.

## Reports
From the Intelligence tab:
- Current inventory CSV
- Daily movement CSV
- Current order CSV
- Excel workbook
- PDF report
- Full JSON backup

## Production deployment checklist
1. Put this project in `osmanyaxka10/hajj-terminal-inventory`.
2. Import the repo into Vercel.
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - optional `OPENAI_API_KEY`
4. Deploy.
5. Test Supabase login.
6. Enter one physical count and one receiving event.
7. Verify movement after the next physical count.
8. Approve an order and confirm forecast-learning history.

## Optional external setup
- Push the project to GitHub and deploy to the preferred host
- Add `OPENAI_API_KEY` only if the read-only AI tab is needed
- Add an automatic Google Drive backup or direct Calendar connector if desired later
