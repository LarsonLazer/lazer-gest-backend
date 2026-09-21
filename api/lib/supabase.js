import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Defina SUPABASE_URL e SUPABASE_ANON_KEY nas variáveis de ambiente.");
}

export const supabase = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
