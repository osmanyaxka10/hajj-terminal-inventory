import { createClient } from "@supabase/supabase-js";

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const configuredKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey);

// Build-safe placeholders. Production must provide the two NEXT_PUBLIC_SUPABASE_* variables.
const url = configuredUrl || "https://example.supabase.co";
const key = configuredKey || "sb_publishable_not_configured";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
