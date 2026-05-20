import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key"
    );
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop: string | symbol) {
    return Reflect.get(getClient(), prop);
  },
});
