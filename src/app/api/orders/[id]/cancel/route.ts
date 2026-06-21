import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelOrder } from "@/lib/otp-provider/rumahotp";

/**
 * POST /api/orders/[id]/cancel
 * User membatalkan pesanan secara manual (misal salah pilih, atau
 * sudah tidak butuh nomor lagi) selama OTP belum diterima.
 * Saldo akan dikembalikan penuh.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Anda harus login" }, { status: 401 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, provider_order_id, user_id")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  if (order.status !== "pending" && order.status !== "waiting_otp") {
    return NextResponse.json(
      { error: "Pesanan ini sudah tidak bisa dibatalkan" },
      { status: 409 }
    );
  }

  const admin = createAdminClient();

  if (order.provider_order_id) {
    await cancelOrder(order.provider_order_id);
  }

  await admin.from("orders").update({ status: "cancelled" }).eq("id", id);
  await admin.rpc("refund_order", { p_order_id: id });

  return NextResponse.json({ success: true });
}
