import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTransaction, type PakasirMethod } from "@/lib/payment/pakasir";
import { z } from "zod";

const depositSchema = z.object({
  amount: z
    .number()
    .int()
    .min(10000, "Minimal deposit Rp 10.000")
    .max(10000000, "Maksimal deposit Rp 10.000.000"),
  method: z.enum([
    "qris",
    "bni_va",
    "bri_va",
    "cimb_niaga_va",
    "sampoerna_va",
    "bnc_va",
    "maybank_va",
    "permata_va",
    "atm_bersama_va",
    "artha_graha_va",
  ] as const).default("qris"),
});

/**
 * POST /api/deposit
 * Membuat transaksi deposit baru lewat Pakasir.
 * Pakasir memberi QR dinamis (QRIS) atau nomor VA per transaksi —
 * tidak perlu kode unik manual lagi.
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

  const parsed = depositSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  const { amount, method } = parsed.data;
  const userId = userData.user.id;

  // Batalkan deposit pending lama milik user ini
  await supabase
    .from("deposits")
    .update({ status: "cancelled" })
    .eq("user_id", userId)
    .eq("status", "pending");

  // Buat record deposit dulu untuk dapat ID (dipakai sebagai order_id Pakasir)
  const { data: deposit, error: insertError } = await supabase
    .from("deposits")
    .insert({
      user_id: userId,
      requested_amount: amount,
      unique_code: 0,
      total_amount: amount, // akan diupdate setelah dapat fee dari Pakasir
      payment_method: method,
    })
    .select()
    .single();

  if (insertError || !deposit) {
    console.error("Gagal membuat deposit:", insertError);
    return NextResponse.json(
      { error: "Gagal membuat permintaan deposit" },
      { status: 500 }
    );
  }

  // Buat transaksi di Pakasir menggunakan deposit.id sebagai order_id
  const pakasirResult = await createTransaction(
    deposit.id,
    amount,
    method as PakasirMethod
  );

  console.log("Pakasir result:", JSON.stringify(pakasirResult));

  if (!pakasirResult.success) {
    // Batalkan deposit jika Pakasir gagal
    await supabase
      .from("deposits")
      .update({ status: "cancelled" })
      .eq("id", deposit.id);

    return NextResponse.json(
      { error: pakasirResult.errorMessage ?? "Gagal membuat transaksi pembayaran" },
      { status: 502 }
    );
  }

  // Update deposit dengan data dari Pakasir
  const { data: updatedDeposit } = await supabase
    .from("deposits")
    .update({
      pakasir_order_id: pakasirResult.orderId,
      payment_number: pakasirResult.paymentNumber,
      fee: pakasirResult.fee,
      total_payment: pakasirResult.totalPayment,
      total_amount: pakasirResult.totalPayment,
      expires_at: pakasirResult.expiredAt,
    })
    .eq("id", deposit.id)
    .select()
    .single();

  return NextResponse.json(
    { deposit: updatedDeposit ?? deposit },
    { status: 201 }
  );
}
