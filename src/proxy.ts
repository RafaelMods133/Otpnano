import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware di semua path kecuali file statis,
     * gambar, dan endpoint API callback (callback diverifikasi
     * lewat secret key di URL, bukan sesi user).
     */
    "/((?!_next/static|_next/image|favicon.ico|api/callback|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
