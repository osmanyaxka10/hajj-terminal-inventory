import { createClient } from "@supabase/supabase-js";

const fallbackUrl = "https://ljvqagyzagcrjulfxaxk.supabase.co";
const fallbackKey = "sb_publishable_vnjLvSiMRWniH98SRmvvqg_LDMB9xvM";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
