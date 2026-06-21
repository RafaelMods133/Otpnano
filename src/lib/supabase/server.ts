import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase untuk dipakai di Server Components, Server Actions,
 * dan Route Handlers. Membaca/menulis cookie sesi lewat Next.js cookies().
 * Tetap menggunakan anon key + RLS, BUKAN service role.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll dipanggil dari Server Component (tanpa request context tulis).
            // Bisa diabaikan jika middleware sudah menangani refresh sesi.
          }
        },
      },
    }
  );
}
