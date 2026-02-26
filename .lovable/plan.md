

## Plan: Update Supabase Anon Key

The URL is already correct. Only the publishable/anon key needs updating in two files:

### Steps

1. **Update `src/integrations/supabase/client.ts`** — Replace `SUPABASE_PUBLISHABLE_KEY` value with `sb_publishable_Fb_cLAuZQeuEoBa-STFwpg_FXKtYylM`

2. **Update `.env`** — Replace `VITE_SUPABASE_PUBLISHABLE_KEY` value with the new key

No other changes needed — the Supabase URL and project ID remain the same.

