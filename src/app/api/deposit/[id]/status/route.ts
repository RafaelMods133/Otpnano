import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTransactionDetail } from "@/lib/payment/pakasir";

/**
 * GET /api/deposit/[id]/status
 * Polling status deposit. Jika masih pending, cek juga ke Pakasir
 * sebagai fallback (antisipasi webhook terlambat/gagal).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Anda harus login" }, { status: 401 });
  }

  const { data: deposit, error } = await supabase
    .from("deposits")
    .select("*")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error || !deposit) {
    return NextResponse.json({ error: "Deposit tidak ditemukan" }, { status: 404 });
  }

  // Auto-expire jika sudah lewat waktu
  if (
    deposit.status === "pending" &&
    new Date(deposit.expires_at).getTime() < Date.now()
  ) {
    await supabase
      .from("deposits")
      .update({ status: "expired" })
      .eq("id", id);
    deposit.status = "expired";
    return NextResponse.json({ deposit });
  }

  // Jika masih pending, tanya Pakasir sebagai fallback
  if (deposit.status === "pending" && deposit.pakasir_order_id) {
    try {
      const detail = await getTransactionDetail(
        deposit.pakasir_order_id,
        deposit.requested_amount
      );

      if (detail?.status === "completed") {
        const admin = createAdminClient();
        await admin.rpc("credit_deposit_pakasir", {
          p_pakasir_order_id: deposit.pakasir_order_id,
          p_amount: deposit.requested_amount,
        });
        deposit.status = "paid";
      } else if (detail?.status === "cancelled" || detail?.status === "expired") {
        await supabase
          .from("deposits")
          .update({ status: "expired" })
          .eq("id", id);
        deposit.status = "expired";
      }
    } catch {
      // Jika Pakasir tidak bisa dihubungi, tetap kembalikan status dari DB
    }
  }

  return NextResponse.json({ deposit });
}
