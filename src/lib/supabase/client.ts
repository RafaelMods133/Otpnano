import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase untuk dipakai di Client Components.
 * Menggunakan anon key — aman dipakai di browser karena
 * akses data dibatasi oleh Row Level Security (RLS).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
