import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export async function getDatabase(): Promise<SupabaseClient> {
  if (cached) return cached;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  cached = supabaseAdmin as unknown as SupabaseClient;
  return cached;
}
