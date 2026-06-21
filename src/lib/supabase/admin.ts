import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase dengan SERVICE ROLE KEY.
 *
 * ⚠️ HANYA dipakai di Route Handlers server-side yang tidak punya
 * sesi user (contoh: webhook callback QRIS dari SMP Payment, atau
 * worker yang polling status OTP dari provider). Service role
 * melewati semua Row Level Security, jadi JANGAN pernah import
 * file ini ke Client Component atau kirim hasilnya ke browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_URL belum diset di environment variables."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
