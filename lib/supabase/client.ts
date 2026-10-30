import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ATLAS currently reuses the existing Supabase project so its Auth, email
// delivery configuration, and existing customer data are preserved.
// These are public browser credentials; database access must be protected by RLS.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://zyloazosnfykpxpjxmuq.supabase.co";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_J8r63wGAaElkYxi7vZX0VQ_zydDYpYh";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
