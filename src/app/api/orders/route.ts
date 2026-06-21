import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderNumber } from "@/lib/otp-provider/rumahotp";
import { z } from "zod";

const orderSchema = z.object({
  productId: z.string().uuid(),
});

/**
 * POST /api/orders
 * Alur pembelian nokos:
 * 1. Validasi produk aktif & stok tersedia.
 * 2. Debit saldo user secara atomic (anti saldo negatif via RPC).
 * 3. Pesan nomor ke provider Rumah OTP.
 * 4. Jika provider gagal memberi nomor, refund otomatis.
 * 5. Simpan order dengan status "waiting_otp" dan nomor yang didapat.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Anda harus login" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "productId tidak valid" }, { status: 400 });
  }

  const userId = userData.user.id;

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*, country:countries(*), service:services(*)")
    .eq("id", parsed.data.productId)
    .eq("is_active", true)
    .maybeSingle();

  if (productError || !product) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  if (product.stock <= 0) {
    return NextResponse.json({ error: "Stok nomor sedang habis" }, { status: 409 });
  }

  // Gunakan admin client untuk operasi yang butuh RPC security-definer
  // (debit saldo) supaya konsisten dengan callback handler.
  const admin = createAdminClient();

  // Buat order dengan status "pending" dulu sebelum debit, supaya kita
  // punya reference_id untuk ledger.
  const { data: order, error: orderInsertError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      product_id: product.id,
      country_id: product.country_id,
      service_id: product.service_id,
      price: product.price,
      status: "pending",
      expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 menit
    })
    .select()
    .single();

  if (orderInsertError || !order) {
    console.error("Gagal membuat order:", orderInsertError);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }

  // ---- Debit saldo secara atomic ----
  const { error: debitError } = await admin.rpc("debit_for_purchase", {
    p_user_id: userId,
    p_amount: product.price,
    p_order_id: order.id,
    p_description: `Beli nokos ${product.service?.name ?? ""} (${product.country?.name ?? ""})`,
  });

  if (debitError) {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);

    if (debitError.message?.includes("INSUFFICIENT_BALANCE")) {
      return NextResponse.json(
        { error: "Saldo Anda tidak cukup, silakan deposit terlebih dahulu" },
        { status: 402 }
      );
    }
    console.error("Gagal debit saldo:", debitError);
    return NextResponse.json({ error: "Gagal memproses pembayaran" }, { status: 500 });
  }

  // ---- Pesan nomor dari provider ----
  const providerResult = await orderNumber({
    countryCode: product.provider_country_code,
    serviceCode: product.provider_service_code,
  });

  if (!providerResult.success || !providerResult.phoneNumber) {
    // Provider gagal memberi nomor -> refund otomatis
    await admin.rpc("refund_order", { p_order_id: order.id });
    return NextResponse.json(
      {
        error:
          providerResult.errorMessage ??
          "Nomor sedang tidak tersedia, saldo Anda telah dikembalikan",
      },
      { status: 502 }
    );
  }

  const { data: updatedOrder, error: updateError } = await admin
    .from("orders")
    .update({
      status: "waiting_otp",
      provider_order_id: providerResult.providerOrderId,
      phone_number: providerResult.phoneNumber,
    })
    .eq("id", order.id)
    .select("*, country:countries(*), service:services(*)")
    .single();

  if (updateError) {
    console.error("Gagal update order setelah dapat nomor:", updateError);
  }

  // Kurangi stok produk
  await admin
    .from("products")
    .update({ stock: Math.max(product.stock - 1, 0) })
    .eq("id", product.id);

  return NextResponse.json(
    { order: updatedOrder ?? order },
    { status: 201 }
  );
}
