import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "lazer-gest";

export function sanitizePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/\.\./g, "")
    .replace(/^\/+/, "")
    .replace(/[^a-zA-Z0-9._\-/]/g, "-");
}

export function publicStorageUrl(path) {
  const clean = sanitizePath(path);
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${clean}`;
}
