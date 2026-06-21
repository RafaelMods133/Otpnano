import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkOtpStatus } from "@/lib/otp-provider/rumahotp";

/**
 * GET /api/orders/[id]/status
 * Dipanggil berulang (polling) oleh halaman order untuk mengecek
 * apakah OTP sudah masuk dari provider Rumah OTP.
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

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, country:countries(*), service:services(*)")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  // Auto-expire + refund jika lewat waktu dan OTP belum masuk
  if (
    order.status === "waiting_otp" &&
    order.expires_at &&
    new Date(order.expires_at).getTime() < Date.now()
  ) {
    const admin = createAdminClient();
    await admin.from("orders").update({ status: "expired" }).eq("id", id);
    await admin.rpc("refund_order", { p_order_id: id });
    order.status = "expired";
    return NextResponse.json({ order });
  }

  // Jika masih menunggu OTP, tanya provider apakah sudah ada kode masuk
  if (order.status === "waiting_otp" && order.provider_order_id) {
    const otpResult = await checkOtpStatus(order.provider_order_id);

    if (otpResult.status === "received" && otpResult.otpCode) {
      const admin = createAdminClient();
      const { data: updated } = await admin
        .from("orders")
        .update({
          status: "completed",
          otp_code: otpResult.otpCode,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*, country:countries(*), service:services(*)")
        .single();

      return NextResponse.json({ order: updated ?? order });
    }

    if (otpResult.status === "expired" || otpResult.status === "cancelled") {
      const admin = createAdminClient();
      await admin.from("orders").update({ status: "expired" }).eq("id", id);
      await admin.rpc("refund_order", { p_order_id: id });
      order.status = "expired";
    }
  }

  return NextResponse.json({ order });
}
