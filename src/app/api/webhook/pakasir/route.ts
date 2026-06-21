import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * WEBHOOK PAKASIR
 * ============================================================
 * Daftarkan URL ini di dashboard Pakasir (Edit Proyek > Webhook URL):
 *   https://domainanda.vercel.app/api/webhook/pakasir
 *
 * Pakasir mengirim HTTP POST saat pembayaran berhasil dengan payload:
 * {
 *   "amount": 22000,
 *   "order_id": "deposit-uuid",
 *   "project": "slug-anda",
 *   "status": "completed",
 *   "payment_method": "qris",
 *   "completed_at": "2024-09-10T08:07:02.819+07:00"
 * }
 *
 * order_id = deposit.id dari database kita (yang dikirim saat create transaksi)
 */
export async function POST(request: NextRequest) {
  let payload: {
    amount: number;
    order_id: string;
    project: string;
    status: string;
    payment_method: string;
    completed_at: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { amount, order_id, project, status } = payload;

  // Validasi field wajib
  if (!amount || !order_id || !project || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Validasi project slug sesuai milik kita
  const expectedProject = process.env.PAKASIR_PROJECT_SLUG;
  if (expectedProject && project !== expectedProject) {
    return NextResponse.json({ error: "Invalid project" }, { status: 401 });
  }

  // Hanya proses jika status "completed"
  if (status !== "completed") {
    return NextResponse.json({ ok: true, note: "Status ignored" });
  }

  const supabase = createAdminClient();

  // Kredit saldo user secara atomic via RPC
  const { data, error } = await supabase.rpc("credit_deposit_pakasir", {
    p_pakasir_order_id: order_id,
    p_amount: amount,
  });

  if (error) {
    console.error("Webhook Pakasir RPC error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  const result = data as { error?: string; success?: boolean };

  if (result?.error === "DEPOSIT_NOT_FOUND") {
    console.warn("Webhook Pakasir: deposit tidak ditemukan untuk order_id:", order_id);
    // Balas 200 agar Pakasir tidak retry terus
    return NextResponse.json({ ok: true, note: "Deposit not found" });
  }

  if (result?.error === "DEPOSIT_ALREADY_PROCESSED") {
    return NextResponse.json({ ok: true, note: "Already processed" });
  }

  return NextResponse.json({ ok: true });
}
